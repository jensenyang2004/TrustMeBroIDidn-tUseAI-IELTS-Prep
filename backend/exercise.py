import os
import random
import json
from typing import Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv

# ── Configuration ─────────────────────────────────────────────────────────────

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env.local"))

# ── Topic Pool ─────────────────────────────────────────────────────────────────

TOPIC_POOL = [
    "climate change", "urban development", "remote work", "social media",
    "public transport", "healthcare", "education reform", "artificial intelligence",
    "immigration", "tourism", "food security", "mental health",
    "space exploration", "renewable energy", "youth unemployment",
    "gender equality", "consumer culture", "biodiversity", "digital privacy",
    "ageing population", "globalisation", "income inequality", "volunteerism",
    "media influence", "sport and society",
]

# ── Category → Subcategory map ─────────────────────────────────────────────────

CATEGORIES = {
    "lexical_resource": [
        "synonym_mapping",
        "sentence_paraphrasing",
        "word_transformation",
    ],
    "grammatical_range": [
        "sentence_synthesis",
        "conditional_formulation",
        "structural_variation",
    ],
    "argument_development": [
        "thesis_generation",
        "peel_paragraph",
        "concession_rebuttal",
        "brainstorming_outlines",
    ],
    "data_translation": [
        "trend_description",
        "comparative_statements",
        "overview_paragraph",
        "sequential_linking",
    ],
    "functional_communication": [
        "tone_shifting",
        "purpose_formulation",
        "functional_micro_drafts",
    ],
    "cohesion_coherence": [
        "transitioning",
        "pronoun_referencing",
    ],
}

# ── Per-subcategory system instructions ───────────────────────────────────────

SUBCATEGORY_PROMPTS = {
    # Lexical Resource
    "synonym_mapping": """
        Generate a synonym mapping exercise for IELTS writing practice.
        Pick one common IELTS word related to the topic (e.g. "increase", "important", "show").
        Ask the user to list 4–5 context-appropriate synonyms and use two of them in sentences.
    """,
    "sentence_paraphrasing": """
        Generate a sentence paraphrasing exercise for IELTS writing practice.
        Write one clear academic sentence related to the topic.
        Ask the user to rewrite it in 3 completely different ways without changing the meaning.
    """,
    "word_transformation": """
        Generate a word transformation exercise for IELTS writing practice.
        Pick one core word related to the topic.
        Ask the user to write the noun, verb, adjective, and adverb forms,
        and use each in a separate sentence.
    """,

    # Grammatical Range
    "sentence_synthesis": """
        Generate a sentence synthesis exercise for IELTS writing practice.
        Write 2–3 short, simple sentences related to the topic.
        Ask the user to combine them into one fluent complex or compound sentence.
    """,
    "conditional_formulation": """
        Generate a conditional formulation exercise for IELTS writing practice.
        Describe a real-world situation or policy scenario related to the topic.
        Ask the user to write two sentences: one using a Type 1 conditional and
        one using a Type 2 conditional.
    """,
    "structural_variation": """
        Generate a structural variation exercise for IELTS writing practice.
        Write one standard active-voice sentence related to the topic.
        Ask the user to rewrite it in: (1) passive voice, (2) starting with an
        introductory adverbial clause, and (3) starting with a gerund phrase.
    """,

    # Argument Development
    "thesis_generation": """
        Generate a thesis generation exercise for IELTS Task 2 writing practice.
        Provide a realistic Task 2 essay prompt related to the topic.
        Ask the user to write a single, clear thesis sentence that states their
        position and outlines the two main points they will argue.
    """,
    "peel_paragraph": """
        Generate a PEEL paragraph exercise for IELTS Task 2 writing practice.
        Provide a Task 2 essay prompt and a specific argument angle related to the topic.
        Ask the user to write one complete body paragraph following the
        Point → Evidence → Explanation → Link structure.
    """,
    "concession_rebuttal": """
        Generate a concession and rebuttal exercise for IELTS Task 2 writing practice.
        State a clear opposing viewpoint related to the topic.
        Ask the user to write a short paragraph that: (1) acknowledges the opposing view
        fairly, and (2) logically rebuts it to reinforce their own stance.
    """,
    "brainstorming_outlines": """
        Generate a brainstorming outline exercise for IELTS Task 2 writing practice.
        Provide a Task 2 essay prompt related to the topic.
        Ask the user to produce only a planning outline: two main arguments for each
        side (or for/against), each with one supporting example. No full sentences needed.
    """,

    # Data Translation
    "trend_description": """
        Generate a trend description exercise for IELTS Academic Task 1 writing practice.
        Describe a simple data scenario in text (e.g. "Sales rose from 200 to 450 units
        between 2010 and 2020") related to the topic. Do NOT use an actual image.
        Ask the user to write two academic sentences describing the trend using
        appropriate vocabulary (e.g. surged, declined gradually, peaked at).
    """,
    "comparative_statements": """
        Generate a comparative statements exercise for IELTS Academic Task 1 writing practice.
        Describe two or three distinct data points in text related to the topic
        (e.g. country A vs country B, two time periods, two categories).
        Ask the user to write two sentences that directly contrast the figures
        using comparative structures.
    """,
    "overview_paragraph": """
        Generate an overview paragraph exercise for IELTS Academic Task 1 writing practice.
        Describe a simple chart or diagram in text (2–4 key features) related to the topic.
        Ask the user to write only the overview paragraph — two to three sentences
        summarising the most significant trends or features without quoting specific numbers.
    """,
    "sequential_linking": """
        Generate a sequential linking exercise for IELTS Academic Task 1 writing practice.
        Describe 3–4 steps of a simple process or natural cycle related to the topic
        (e.g. water recycling, manufacturing a product).
        Ask the user to write those steps as connected academic sentences using
        chronological transition words (first, subsequently, once, finally, etc.).
    """,

    # Functional Communication
    "tone_shifting": """
        Generate a tone shifting exercise for IELTS General Task 1 writing practice.
        Write one informal statement or request related to the topic
        (e.g. "I wanna complain about the noise next door").
        Ask the user to rewrite it in: (1) semi-formal tone and (2) highly formal tone.
    """,
    "purpose_formulation": """
        Generate a purpose formulation exercise for IELTS General Task 1 writing practice.
        Describe a realistic letter-writing scenario related to the topic
        (e.g. writing to a landlord, a company, a local council).
        Ask the user to write only the opening sentence of the letter that
        clearly and professionally states the reason for writing.
    """,
    "functional_micro_drafts": """
        Generate a functional micro-draft exercise for IELTS General Task 1 writing practice.
        Specify one letter function related to the topic — choose one of:
        making a complaint, offering an apology, making a request, suggesting an alternative,
        or expressing gratitude.
        Ask the user to write a single focused paragraph that fulfils that one function clearly.
    """,

    # Cohesion & Coherence
    "transitioning": """
        Generate a transitioning exercise for IELTS writing practice.
        Write the final sentence of a paragraph discussing advantages related to the topic,
        and the first sentence of a following paragraph discussing disadvantages.
        Ask the user to write one bridging sentence that links the two paragraphs
        smoothly and signals the contrast.
    """,
    "pronoun_referencing": """
        Generate a pronoun referencing exercise for IELTS writing practice.
        Write a short paragraph (4–5 sentences) related to the topic that repeats
        a key noun excessively (e.g. "renewable energy" appears in every sentence).
        Ask the user to rewrite the paragraph replacing repeated nouns with
        appropriate pronouns and referencing words (this, these, it, such, the former, etc.).
    """,
}

# ── Question Generator ────────────────────────────────────────────────────────

class QuestionGenerator:
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-3-flash-preview"):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment or provided.")

        self.client = genai.Client(api_key=self.api_key)
        self.model_name = model_name

    def generate(self, category: str, subcategory: str = None) -> dict:
        """
        Generate one IELTS writing practice question.

        Args:
            category:    One of the keys in CATEGORIES (e.g. "lexical_resource").
            subcategory: Optional. If omitted, one is chosen at random from the category.

        Returns:
            dict with keys: category, subcategory, topic, instruction, stimulus
        """
        # Validate category
        if category not in CATEGORIES:
            raise ValueError(f"Unknown category '{category}'. Choose from: {list(CATEGORIES.keys())}")

        # Pick subcategory
        if subcategory is None:
            subcategory = random.choice(CATEGORIES[category])
        elif subcategory not in CATEGORIES[category]:
            raise ValueError(f"Unknown subcategory '{subcategory}' for category '{category}'.")

        # Sample topic
        topic = random.choice(TOPIC_POOL)

        # Build prompt
        system_instruction = SUBCATEGORY_PROMPTS[subcategory].strip()
        user_prompt = f"""
Topic: {topic}

Generate the exercise now. Return JSON with exactly these keys:
{{
  "instruction": "<what the user must do, in one or two clear sentences>",
  "stimulus": "<the sentence / data / scenario / paragraph they will work with>"
}}
""".strip()

        full_prompt = f"{system_instruction}\n\n{user_prompt}"

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[full_prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        parsed = json.loads(response.text)

        return {
            "category": category,
            "subcategory": subcategory,
            "topic": topic,
            "instruction": parsed["instruction"],
            "stimulus": parsed["stimulus"],
        }


# ── Quick test ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    generator = QuestionGenerator()

    # Test one question from each category
    for cat in CATEGORIES:
        print(f"\n{'='*60}")
        print(f"Category: {cat}")
        q = generator.generate(cat)
        print(f"Subcategory : {q['subcategory']}")
        print(f"Topic       : {q['topic']}")
        print(f"Instruction : {q['instruction']}")
        print(f"Stimulus    : {q['stimulus']}")