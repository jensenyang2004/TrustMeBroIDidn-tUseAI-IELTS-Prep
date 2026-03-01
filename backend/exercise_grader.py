import os
import json
from typing import Optional, Literal
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pydantic import BaseModel

# ── Configuration ─────────────────────────────────────────────────────────────

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.local"))

# ── Response Schema ────────────────────────────────────────────────────────────

class ErrorAnnotation(BaseModel):
    original: str      # exact fragment from user's answer
    issue: str         # short description of the problem
    suggestion: str    # corrected version of that fragment
    error_type: Literal["grammar", "vocabulary", "structure", "coherence", "task"]


class ImprovementNote(BaseModel):
    type: Literal[
        "vocabulary_upgrade",
        "restructure",
        "formality_adjustment",
        "conciseness",
        "coherence_link",
        "task_fulfilment",
    ]
    before: str   # original fragment (empty string if something was purely added)
    after: str    # improved version
    reason: str   # 1-2 sentences explaining why this change improves the writing


class ExerciseGradingResponse(BaseModel):
    task_completion: Literal["complete", "partial", "off-task"]
    errors: list[ErrorAnnotation]
    feedback_summary: str       # 2-3 sentence overall comment
    improved_version: str       # full clean rewrite of the user's answer
    improvement_notes: list[ImprovementNote]


# ── Grader ─────────────────────────────────────────────────────────────────────

class ShortAnswerGrader:
    SYSTEM_PROMPT = """
You are a strict but encouraging IELTS writing tutor grading short practice exercises.

You will receive:
- The exercise type (category and subcategory)
- The instruction given to the student
- The stimulus they were given (sentence, data, scenario, etc.)
- The student's answer

Your job is to:
1. Judge whether they completed the task as instructed.
2. Identify specific errors in their answer (grammar, vocabulary, structure, coherence, or task errors).
3. Write a clean improved version of their answer.
4. Break down every meaningful change you made into typed before/after improvement notes.
5. Summarise your overall feedback in 2-3 sentences.

Be precise. Anchor errors and improvements to exact fragments from the student's answer.
Do not invent errors that aren't there. If the answer is strong, say so.
""".strip()

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-3-flash-preview"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment or provided.")

        self.client = genai.Client(api_key=self.api_key)
        self.model_name = model_name

    def grade(self, question: dict, user_answer: str) -> ExerciseGradingResponse:
        """
        Grade a student's short answer against the original question.

        Args:
            question:    The question dict returned by QuestionGenerator.generate()
                         (must have: category, subcategory, instruction, stimulus)
            user_answer: The raw text the student submitted.

        Returns:
            ExerciseGradingResponse pydantic model.
        """
        prompt = f"""
Exercise type   : {question['category']} → {question['subcategory']}
Instruction     : {question['instruction']}
Stimulus        : {question['stimulus']}

Student's answer:
\"\"\"{user_answer}\"\"\"

Grade the answer now.
""".strip()

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[prompt],
            config=types.GenerateContentConfig(
                system_instruction=self.SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=ExerciseGradingResponse,
            ),
        )

        return ExerciseGradingResponse(**json.loads(response.text))


# ── Quick test ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    grader = ShortAnswerGrader()

    sample_question = {
        "category": "grammatical_range",
        "subcategory": "sentence_synthesis",
        "topic": "renewable energy",
        "instruction": "Combine the sentences below into one fluent complex or compound sentence.",
        "stimulus": "Solar panels are becoming cheaper. Many households still cannot afford them. Governments must provide subsidies.",
    }

    sample_answer = "While solar panels are becoming cheaper, majority of households still cannot afford them without governments' subsidies."

    result = grader.grade(sample_question, sample_answer)

    print(f"Task completion : {result.task_completion}")
    print(f"Feedback        : {result.feedback_summary}")
    print(f"\nErrors ({len(result.errors)}):")
    for e in result.errors:
        print(f"  [{e.error_type}] '{e.original}' → {e.suggestion}  |  {e.issue}")
    print(f"\nImproved version:\n  {result.improved_version}")
    print(f"\nImprovement notes ({len(result.improvement_notes)}):")
    for note in result.improvement_notes:
        print(f"  [{note.type}]")
        print(f"    before : {note.before}")
        print(f"    after  : {note.after}")
        print(f"    reason : {note.reason}")