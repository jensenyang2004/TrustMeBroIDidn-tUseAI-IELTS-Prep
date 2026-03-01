import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
from pydantic import ValidationError
from models import GradingResponse, PracticeTask
from exercise import QuestionGenerator
from exercise_grader import ShortAnswerGrader
from grader import IELTSTask2Grader
from task1_grader import IELTSTask1Grader
from dotenv import load_dotenv
from database import db, User, Submission, PillarScore, ErrorAnnotation, ImprovementNote, VaultItem
from datetime import datetime, date
from sqlalchemy import func

# Load .env.local from project root using absolute path
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, "../.env.local"))

app = Flask(__name__)
CORS(app)

# Supabase Database Configuration
# Using SUPABASE_URL to match .env.local
db_uri = os.getenv("SUPABASE_URL")
if not db_uri:
    raise RuntimeError("SUPABASE_URL environment variable is not set. Check your .env.local file.")

# SQLAlchemy 1.4+ requires postgresql:// instead of postgres:// 
# though Supabase usually provides postgresql:// already.
if db_uri.startswith("postgres://"):
    db_uri = db_uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()
    # Ensure a default user exists
    if not User.query.first():
        db.session.add(User(name="IELTS Candidate", target_band=7.5, credits=20))
        db.session.commit()

api_key = os.getenv("NEXT_PUBLIC_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

# Initialize features
question_generator = QuestionGenerator(api_key=api_key)
exercise_grader = ShortAnswerGrader(api_key=api_key)
task2_grader = IELTSTask2Grader(api_key=api_key)
task1_grader = IELTSTask1Grader(api_key=api_key)

def save_submission(task_type, prompt_text, user_response, result_dict, category=None, subcategory=None):
    user = User.query.first()
    
    submission = Submission(
        user_id=user.id,
        task_type=task_type,
        prompt_text=prompt_text,
        user_response=user_response,
        category=category,
        subcategory=subcategory,
        overall_band_score=result_dict.get("overall_band_score"),
        task_completion=result_dict.get("task_completion"),
        justification=result_dict.get("justification") or result_dict.get("feedback_summary"),
        improved_version=result_dict.get("improved_version")
    )
    db.session.add(submission)
    db.session.flush()

    # Save Pillars
    pillars_data = result_dict.get("pillars", {})
    for name, data in pillars_data.items():
        if data:
            db.session.add(PillarScore(
                submission_id=submission.id,
                name=name,
                score=data.get("score"),
                feedback=data.get("feedback")
            ))

    # Save Errors
    for err in result_dict.get("errors", []):
        db.session.add(ErrorAnnotation(
            submission_id=submission.id,
            original=err.get("original"),
            improved=err.get("suggestion"),
            issue=err.get("issue"),
            error_type=err.get("error_type")
        ))

    # Save Improvements
    for note in result_dict.get("improvement_notes", []):
        db.session.add(ImprovementNote(
            submission_id=submission.id,
            note_type=note.get("type"),
            before=note.get("before"),
            after=note.get("after"),
            reason=note.get("reason")
        ))

    db.session.commit()
    return submission.id

@app.route("/api/grade", methods=["POST"])
def grade():
    user = User.query.first()
    
    if request.is_json:
        data = request.json
        prompt_text = data.get("prompt_text")
        user_response = data.get("user_response")
        task_type_input = data.get("task_type", "task2")
    else:
        prompt_text = request.form.get("prompt_text")
        user_response = request.form.get("user_response")
        task_type_input = request.form.get("task_type", "task1")

    COSTS = {"exercise": 1, "task1": 3, "task2": 5}
    cost = COSTS.get(task_type_input, 0)
    if user.credits < cost:
        return jsonify({"error": f"Insufficient credits. Requires {cost}."}), 402

    result_dict = None
    if task_type_input == "task2":
        try:
            result = task2_grader(task=prompt_text, essay_text=user_response)
            result_dict = result.model_dump()
        except Exception as e:
            return jsonify({"error": f"Task 2 grading failed: {str(e)}"}), 500

    elif task_type_input == "task1":
        image_file = request.files.get("image")
        if not image_file:
            return _fallback_grade("task1", prompt_text, user_response, "")
        
        try:
            image_bytes = image_file.read()
            result = task1_grader(
                task_text=prompt_text, 
                essay_text=user_response, 
                image_bytes=image_bytes,
                mime_type=image_file.content_type
            )
            result_dict = result.model_dump()
        except Exception as e:
            return jsonify({"error": f"Task 1 grading failed: {str(e)}"}), 500

    if result_dict:
        user.credits -= cost
        save_submission(task_type_input, prompt_text, user_response, result_dict)
        result_dict["prompt_text"] = prompt_text
        result_dict["user_response"] = user_response
        result_dict["credits_remaining"] = user.credits
        return jsonify(result_dict)

    return jsonify({"error": "Invalid task type"}), 400

@app.route("/api/exercise/grade", methods=["POST"])
def grade_exercise():
    user = User.query.first()
    data = request.json or {}
    question = data.get("question")
    user_answer = data.get("user_answer")
    
    if user.credits < 1:
        return jsonify({"error": "Insufficient credits."}), 402

    try:
        result = exercise_grader.grade(question, user_answer)
        result_dict = result.model_dump()
        
        user.credits -= 1
        save_submission(
            "exercise", 
            question.get("instruction") + "\n" + question.get("stimulus"), 
            user_answer, 
            result_dict,
            category=question.get("category"),
            subcategory=question.get("subcategory")
        )
        result_dict["question"] = question
        result_dict["user_answer"] = user_answer
        result_dict["credits_remaining"] = user.credits
        return jsonify(result_dict)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/stats", methods=["GET"])
def get_user_stats():
    user = User.query.first()
    avg_score = db.session.query(func.avg(Submission.overall_band_score)).filter(Submission.task_type.in_(['task1', 'task2'])).scalar() or 0
    total_tasks = Submission.query.count()
    
    return jsonify({
        "avg_band": round(float(avg_score), 2),
        "total_tasks": total_tasks,
        "credits": user.credits,
        "growth": "+0.5" 
    })

@app.route("/api/user/credits", methods=["GET"])
def get_credits():
    user = User.query.first()
    return jsonify({"credits": user.credits})

@app.route("/api/user/activity", methods=["GET"])
def get_activity():
    results = db.session.query(func.date(Submission.created_at), func.count(Submission.id)).group_by(func.date(Submission.created_at)).all()
    return jsonify({str(date_val): count for date_val, count in results})

@app.route("/api/user/history", methods=["GET"])
def get_history():
    submissions = Submission.query.order_by(Submission.created_at.desc()).limit(20).all()
    return jsonify([{
        "id": s.id,
        "type": s.task_type.capitalize(),
        "topic": s.prompt_text[:50] + "...",
        "score": s.overall_band_score or "Complete",
        "date": s.created_at.strftime("%Y-%m-%d")
    } for s in submissions])

@app.route("/api/vault", methods=["GET", "POST"])
def manage_vault():
    user = User.query.first()
    if request.method == "POST":
        data = request.json
        exists = VaultItem.query.filter_by(user_id=user.id, before=data.get("before"), after=data.get("after")).first()
        if not exists:
            item = VaultItem(
                user_id=user.id,
                note_type=data.get("type"),
                before=data.get("before"),
                after=data.get("after"),
                reason=data.get("reason")
            )
            db.session.add(item)
            db.session.commit()
        return jsonify({"status": "success"})
    
    items = VaultItem.query.filter_by(user_id=user.id).order_by(VaultItem.created_at.desc()).all()
    return jsonify([{
        "id": i.id,
        "type": i.note_type,
        "before": i.before,
        "after": i.after,
        "reason": i.reason
    } for i in items])

@app.route("/api/vault/<int:item_id>", methods=["DELETE"])
def delete_vault_item(item_id):
    item = VaultItem.query.get(item_id)
    if item:
        db.session.delete(item)
        db.session.commit()
    return jsonify({"status": "success"})

@app.route("/api/practice", methods=["POST"])
def generate_practice():
    data = request.json or {}
    practice_type = data.get("type")
    prompt = f"Generate a unique IELTS Short Practice task. Type: {practice_type or 'Random'}"
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=PracticeTask)
    )
    return jsonify(json.loads(response.text))

@app.route("/api/exercise/generate", methods=["POST"])
def generate_exercise():
    data = request.json or {}
    try:
        exercise = question_generator.generate(data.get("category"), data.get("subcategory"))
        return jsonify(exercise)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def _fallback_grade(task_type, prompt_text, user_response, image_context):
    user = User.query.first()
    prompt_path = os.path.join(os.path.dirname(__file__), "../data/prompt.md")
    with open(prompt_path, "r") as f:
        prompt_template = f.read()
    task_label = "Task 1" if task_type == "task1" else "Task 2"
    full_prompt = f"{prompt_template}\nInput Data:\n* Task Type: {task_label}\n* Task Prompt: {prompt_text}\n* Visual Context: {image_context}\n* Candidate Submission: {user_response}"
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=full_prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=GradingResponse)
    )
    result_dict = json.loads(response.text)
    user.credits -= (3 if task_type == "task1" else 5)
    save_submission(task_type, prompt_text, user_response, result_dict)
    result_dict["prompt_text"] = prompt_text
    result_dict["user_response"] = user_response
    result_dict["task_type"] = task_type
    result_dict["credits_remaining"] = user.credits
    return jsonify(result_dict)

if __name__ == "__main__":
    app.run(port=5001, debug=True)
