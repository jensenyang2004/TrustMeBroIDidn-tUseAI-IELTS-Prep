This is the **"Vibe Code" Blueprint** for your IELTS Practice Web App. Since you're building this in a day, I’ve designed the logic to be **state-driven**—this means the LLM does the heavy lifting of "creating" the content, but your code provides the strict "guardrails" (the schema) to keep it from being repetitive.

---

# Project: IELTS "Vibe" Tutor - Requirement Document

## 1. System Overview

A lightweight web application for IELTS writing practice featuring automated grading (unified rules), incremental short exercises, and a persistent weakness-tracking buffer to influence future difficulty.

---

## 2. Core Feature Specifications

### 2.1 The Unified Grading Engine (批改)

* **Logic:** Every submission (Short or Full) is sent to an LLM with a "Strict Examiner" System Prompt.
* **Grading Criteria:** Must follow the 4 official IELTS pillars:
1. **Task Response** (Did they answer the prompt?)
2. **Coherence & Cohesion** (Logical flow/transitions)
3. **Lexical Resource** (Vocabulary range/precision)
4. **Grammatical Range & Accuracy** (Error count/sentence variety)


* **Output Format:** JSON containing `band_score`, `justification`, `corrections` (original vs. improved), and `top_3_weaknesses`.

### 2.2 Question Generation Logic (出題)

To prevent repetition and ensure coverage, the system uses a **Matrix Generation Strategy**.

#### A. The Global Category Matrix

The system rotates through these 3 domains to ensure variety:

1. **Society & Education:** (e.g., University fees, crime, school uniforms)
2. **Tech & Environment:** (e.g., AI in work, climate change responsibility)
3. **Culture & Lifestyle:** (e.g., Traditional vs. Modern art, tourism impact)

#### B. The Generation Algorithm (The Core Logic)

1. **Check History:** Query the `Practice_Sessions` table for the last 5 categories and question types used by the user.
2. **State Selection:** * If all categories have been used once, trigger **"Nuance Mode"**: Generate a question in a previous category but with a specific, rare sub-topic (e.g., instead of "Global Warming," use "Deep-sea mining ethics").
3. **Prompt Assembly:** * **Input:** `User_Weakness_Buffer` + `Recent_Categories` + `Practice_Type`.
* **Instruction:** "Generate a unique IELTS Task 2 prompt. DO NOT use the words [list of recent keywords]. Focus the prompt complexity on the user's weakness in [Specific Grammar/Vocab Point]."



### 2.3 Short Practice Logic (逐步練習)

Instead of a full 250-word essay, these are "Micro-Tasks."

| Mode | Input Provided by AI | User Task | Logic |
| --- | --- | --- | --- |
| **Intro-Boost** | A controversial prompt. | Write a 2-sentence intro. | Checks for paraphrasing skill. |
| **Argument-Build** | A "for" argument. | Write the "against" counter-point. | Checks for transition words (e.g., *conversely*). |
| **Data-Snap** | A single statistic/fact. | Describe it in one sentence. | Checks for Task 1 specific verbs (e.g., *surged*). |
| **Vocab-Swap** | A "Band 5" basic sentence. | Rewrite into "Band 8+". | Replaces "very," "good," "bad" with collocations. |

---

## 3. Data Schema (Minimalist for 1-Day Build)

### Table: `users`

* `id`: UUID
* `weakness_buffer`: JSONB (Stores a ranked list of errors, e.g., `{ "prepositions": 8, "subject-verb-agreement": 3 }`)
* `mastered_vocab`: Array (Words the user has successfully used 3+ times)

### Table: `practice_sessions`

* `id`: UUID
* `type`: Enum (FULL_ESSAY, SHORT_INTRO, SHORT_VOCAB, SHORT_ARGUMENT)
* `category`: String (Social, Tech, etc.)
* `prompt_text`: Text
* `user_response`: Text
* `feedback`: JSON (Scores + Corrections)
* `created_at`: Timestamp

---

## 4. Advance Goal: Weakness Buffer & Feedback Loop

### The "Buffer" Logic Flow:

1. **Post-Practice Analysis:** After grading, the LLM identifies the "Primary Failure Point" (e.g., "Misuse of 'the'").
2. **Buffer Update:** The system increments the score for that weakness in the `weakness_buffer`.
3. **Adaptive Trigger:** * In the **next** practice generation, the system prompt includes a constraint: *"Force the user to use a 'Direct Question' structure because they are weak at it."*
* In the **next** short practice, it selects a "Vocab-Swap" specifically targeting the words the user misused last time.



---

## 5. Technical Constraints (The "Vibe Code" Stack)

* **Frontend:** Next.js (App Router) + Shadcn UI.
* **Backend:** Supabase (Auth + DB).
* **AI:** OpenAI `gpt-4o-mini` (fast/cheap) or `deepseek-v3`.
* **Streaming:** Use `ai` package (Vercel) for real-time feedback rendering.

---

### Ready to start?

Would you like me to write the **Master System Prompt** for the "Incremental Scenario Generator" (Short Practice) so you can just copy-paste it into your code?