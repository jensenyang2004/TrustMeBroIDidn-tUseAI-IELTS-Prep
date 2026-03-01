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
from jose import jwt

# Load .env.local
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, "../.env.local"))

app = Flask(__name__)
# In production, replace '*' with your actual Vercel URL
CORS(app, resources={r"/api/*": {"origins": "*"}})

# DB Config
db_uri = os.getenv("SUPABASE_URL")
if db_uri and db_uri.startswith("postgres://"):
    db_uri = db_uri.replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Supabase Auth Helper
def get_current_user():
    auth_header = request.headers.get("Authorization", None)
    if not auth_header or not auth_header.startswith("Bearer "):
        print("Auth Failed: No Bearer token in header")
        return None
    
    token = auth_header.split(" ")[1]
    if not token or token == "null" or token == "undefined":
        print(f"Auth Failed: Token is invalid string: {token}")
        return None

    try:
        payload = jwt.get_unverified_claims(token)
        user_id = payload.get("sub")
        if not user_id:
            print("Auth Failed: No 'sub' in JWT payload")
            return None
        
        # Sync user to our local users table
        user = User.query.get(user_id)
        if not user:
            # Try to get email from various possible payload locations
            email = payload.get("email") or payload.get("user_metadata", {}).get("email", "New User")
            print(f"Creating new user record for {user_id} ({email}) with 20 credits")
            user = User(id=user_id, name=email, credits=20)
            db.session.add(user)
            db.session.commit()
        return user
    except Exception as e:
        print(f"Auth error (JWT Parsing): {e}")
        return None

# Initialize features
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)
question_generator = QuestionGenerator(api_key=api_key)
exercise_grader = ShortAnswerGrader(api_key=api_key)
task2_grader = IELTSTask2Grader(api_key=api_key)
task1_grader = IELTSTask1Grader(api_key=api_key)

def save_submission(user_id, task_type, prompt_text, user_response, result_dict, category=None, subcategory=None):
    submission = Submission(
        user_id=user_id,
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

    for name, data in result_dict.get("pillars", {}).items():
        if data:
            db.session.add(PillarScore(submission_id=submission.id, name=name, score=data.get("score"), feedback=data.get("feedback")))

    for err in result_dict.get("errors", []):
        db.session.add(ErrorAnnotation(submission_id=submission.id, original=err.get("original"), improved=err.get("suggestion"), issue=err.get("issue"), error_type=err.get("error_type")))

    for note in result_dict.get("improvement_notes", []):
        db.session.add(ImprovementNote(submission_id=submission.id, note_type=note.get("type"), before=note.get("before"), after=note.get("after"), reason=note.get("reason")))

    db.session.commit()

@app.route("/api/grade", methods=["POST"])
def grade():
    user = get_current_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    
    if request.is_json:
        data = request.json
        prompt_text = data.get("prompt_text")
        user_response = data.get("user_response")
        task_type_input = data.get("task_type", "task2")
    else:
        prompt_text = request.form.get("prompt_text")
        user_response = request.form.get("user_response")
        task_type_input = request.form.get("task_type", "task1")

    cost = {"exercise": 1, "task1": 3, "task2": 5}.get(task_type_input, 0)
    if user.credits < cost: return jsonify({"error": "Insufficient credits"}), 402

    result_dict = None
    if task_type_input == "task2":
        result_dict = task2_grader(task=prompt_text, essay_text=user_response).model_dump()
    elif task_type_input == "task1":
        image_file = request.files.get("image")
        if not image_file: return _fallback_grade(user, "task1", prompt_text, user_response, "")
        image_bytes = image_file.read()
        result_dict = task1_grader(task_text=prompt_text, essay_text=user_response, image_bytes=image_bytes, mime_type=image_file.content_type).model_dump()

    if result_dict:
        user.credits -= cost
        save_submission(user.id, task_type_input, prompt_text, user_response, result_dict)
        result_dict.update({"prompt_text": prompt_text, "user_response": user_response, "credits_remaining": user.credits})
        return jsonify(result_dict)
    return jsonify({"error": "Invalid task"}), 400

@app.route("/api/exercise/grade", methods=["POST"])
def grade_exercise():
    user = get_current_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    if user.credits < 1: return jsonify({"error": "Insufficient credits"}), 402

    data = request.json
    question, user_answer = data.get("question"), data.get("user_answer")
    result = exercise_grader.grade(question, user_answer)
    result_dict = result.model_dump()
    
    user.credits -= 1
    save_submission(user.id, "exercise", question.get("instruction") + "\n" + question.get("stimulus"), user_answer, result_dict, category=question.get("category"), subcategory=question.get("subcategory"))
    result_dict.update({"question": question, "user_answer": user_answer, "credits_remaining": user.credits})
    return jsonify(result_dict)

@app.route("/api/user/stats", methods=["GET"])
def get_user_stats():
    user = get_current_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    avg_score = db.session.query(func.avg(Submission.overall_band_score)).filter(Submission.user_id == user.id, Submission.task_type.in_(['task1', 'task2'])).scalar() or 0
    total_tasks = Submission.query.filter_by(user_id=user.id).count()
    return jsonify({"avg_band": round(float(avg_score), 2), "total_tasks": total_tasks, "credits": user.credits, "growth": "+0.0"})

@app.route("/api/user/credits", methods=["GET"])
def get_credits():
    user = get_current_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    return jsonify({"credits": user.credits})

@app.route("/api/user/activity", methods=["GET"])
def get_activity():
    user = get_current_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    results = db.session.query(func.date(Submission.created_at), func.count(Submission.id)).filter(Submission.user_id == user.id).group_by(func.date(Submission.created_at)).all()
    return jsonify({str(d): c for d, c in results})

@app.route("/api/user/history", methods=["GET"])
def get_history():
    user = get_current_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    subs = Submission.query.filter_by(user_id=user.id).order_by(Submission.created_at.desc()).limit(20).all()
    return jsonify([{"id": s.id, "type": s.task_type.capitalize(), "topic": s.prompt_text[:50] + "...", "score": s.overall_band_score or "Complete", "date": s.created_at.strftime("%Y-%m-%d")} for s in subs])

@app.route("/api/vault", methods=["GET", "POST"])
def manage_vault():
    user = get_current_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    if request.method == "POST":
        data = request.json
        if not VaultItem.query.filter_by(user_id=user.id, before=data.get("before"), after=data.get("after")).first():
            db.session.add(VaultItem(user_id=user.id, note_type=data.get("type"), before=data.get("before"), after=data.get("after"), reason=data.get("reason")))
            db.session.commit()
        return jsonify({"status": "success"})
    items = VaultItem.query.filter_by(user_id=user.id).order_by(VaultItem.created_at.desc()).all()
    return jsonify([{"id": i.id, "type": i.note_type, "before": i.before, "after": i.after, "reason": i.reason} for i in items])

@app.route("/api/vault/<int:item_id>", methods=["DELETE"])
def delete_vault_item(item_id):
    user = get_current_user()
    item = VaultItem.query.filter_by(id=item_id, user_id=user.id).first()
    if item:
        db.session.delete(item)
        db.session.commit()
    return jsonify({"status": "success"})

@app.route("/api/exercise/generate", methods=["POST"])
def generate_exercise():
    user = get_current_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    return jsonify(question_generator.generate(data.get("category"), data.get("subcategory")))

@app.route("/api/practice", methods=["POST"])
def generate_practice():
    user = get_current_user()
    if not user: return jsonify({"error": "Unauthorized"}), 401
    data = request.json or {}
    practice_type = data.get("type")
    prompt = f"Generate a unique IELTS Short Practice task. Type: {practice_type or 'Random'}"
    response = client.models.generate_content(model="gemini-3-flash-preview", contents=prompt, config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=PracticeTask))
    return jsonify(json.loads(response.text))

def _fallback_grade(user, task_type, prompt_text, user_response, image_context):
    prompt_path = os.path.join(os.path.dirname(__file__), "../data/prompt.md")
    with open(prompt_path, "r") as f: prompt_template = f.read()
    full_prompt = f"{prompt_template}\nInput Data:\n* Task Type: {task_type}\n* Task Prompt: {prompt_text}\n* Visual Context: {image_context}\n* Candidate Submission: {user_response}"
    res = client.models.generate_content(model="gemini-3-flash-preview", contents=full_prompt, config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=GradingResponse))
    result_dict = json.loads(res.text)
    user.credits -= (3 if task_type == "task1" else 5)
    save_submission(user.id, task_type, prompt_text, user_response, result_dict)
    result_dict.update({"prompt_text": prompt_text, "user_response": user_response, "task_type": task_type, "credits_remaining": user.credits})
    return jsonify(result_dict)

if __name__ == "__main__":
    app.run(port=5001, debug=True)
