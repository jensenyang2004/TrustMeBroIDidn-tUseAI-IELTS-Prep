from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal

# ── Shared Components ─────────────────────────────────────────────────────────

class ErrorAnnotation(BaseModel):
    original: str = Field(description="The exact fragment from the user's answer containing the error.")
    issue: str = Field(description="A short description of the grammatical or mechanical problem.")
    suggestion: str = Field(description="The corrected version of the fragment.")
    error_type: Literal["grammar", "vocabulary", "structure", "coherence", "punctuation", "spelling"]

class ImprovementNote(BaseModel):
    type: Literal[
        "vocabulary_upgrade",
        "restructure",
        "formality_adjustment",
        "conciseness",
        "coherence_link",
        "task_fulfilment",
        "data_precision"
    ]
    before: str = Field(description="Original fragment (empty string if something was purely added).")
    after: str = Field(description="The improved/polished version.")
    reason: str = Field(description="Explanation of why this change elevates the writing to a higher band.")

class PillarScore(BaseModel):
    score: float = Field(description="Band score in 0.5 increments (e.g., 6.5).")
    feedback: str = Field(description="Justification for this score based strictly on IELTS descriptors.")

class Pillars(BaseModel):
    # We use optional fields for the first pillar to handle both Task 1 and Task 2
    task_achievement: Optional[PillarScore] = Field(None, description="Only for Task 1 (Report).")
    task_response: Optional[PillarScore] = Field(None, description="Only for Task 2 (Essay).")
    coherence_cohesion: PillarScore
    lexical_resource: PillarScore
    grammatical_range_accuracy: PillarScore

# ── Main Grading Response ─────────────────────────────────────────────────────

class GradingResponse(BaseModel):
    task_type: Literal["task1", "task2"]
    overall_band_score: float = Field(description="Average of the 4 pillars, rounded to the nearest 0.5.")
    justification: str = Field(description="A 2-3 sentence overview of why the candidate received this overall band.")
    
    pillars: Pillars
    
    errors: List[ErrorAnnotation] = Field(description="Specific grammatical and mechanical errors found in the text.")
    improvement_notes: List[ImprovementNote] = Field(description="High-level suggestions to polish the writing and reach the next band.")
    
    improved_version: str = Field(description="A full, high-band rewrite of the candidate's submission.")
    
    self_check: str = Field(description="Internal reasoning process for the examiner to ensure grading accuracy.")

# ── Practice Components ───────────────────────────────────────────────────────

class PracticeTask(BaseModel):
    instructions: str
    context: str
    prompt_text: str
    type: str
