import os
import json
from typing import Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv

from models import GradingResponse

class IELTSTask1Grader:
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-3-flash-preview"):
        load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.local"))
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment or provided.")
        
        self.client = genai.Client(api_key=self.api_key)
        self.model_name = model_name

    def __call__(self, task_text: str, essay_text: str, image_bytes: bytes, mime_type: str = "image/png") -> GradingResponse:
        """
        Grade a Task 1 report using both the text and the graph image.
        """
        prompt = self._get_instruction(task=task_text, essay=essay_text)
        
        contents = [
            prompt,
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        ]

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GradingResponse
            )
        )

        result_dict = json.loads(response.text)
        result_dict["task_type"] = "task1"
        
        return GradingResponse(**result_dict)

    def _get_instruction(self, task: str, essay: str) -> str:
        return f"""
        You are an expert IELTS Writing Examiner grading a Task 1 Academic Report.
        
        ## Criteria
        1. **Task Achievement (TA)**: How accurately and completely the candidate describes the visual data. They must provide an overview and highlight key features/trends.
        2. **Coherence & Cohesion (CC)**: Organisation and use of linking words.
        3. **Lexical Resource (LR)**: Range and accuracy of vocabulary.
        4. **Grammatical Range & Accuracy (GRA)**: Variety and correctness of sentence structures.

        ## Input Data
        * **Task Instruction**: {task}
        * **Candidate Submission**: {essay}
        * **Visual Data**: [See attached image]

        ## Output Requirements
        Return a JSON object matching the GradingResponse schema.
        - In the 'pillars' object, use 'task_achievement' for the first score.
        - Ensure all 'errors' and 'improvement_notes' are specific to this report.
        - The 'improved_version' should be a Band 9 model answer for this exact graph.
        - Use 'self_check' to verify the data accuracy against the image before finalizing.
        """.strip()
