# System Design: Yeah I wrote this - with AI (IELTS Practice)

## 1. Architectural Overview

The application follows a **Serverless Architecture** using Next.js and Supabase. All AI logic is orchestrated via **Next.js Server Actions** and **Route Handlers**, which are deployed as serverless functions on Vercel. This ensures that sensitive API keys (Gemini, Supabase Service Role) are never exposed to the client.

### High-Level Stack
- **Frontend/Orchestration**: Next.js 14/15 (App Router).
- **Compute (Serverless)**: Vercel Functions (Server Actions for mutations, Route Handlers for streaming).
- **Backend/BaaS**: Supabase (PostgreSQL, Auth, RLS).
- **AI Engine**: Google Gemini 1.5 Flash (Primary) or Pro via the official SDK.

---

## 2. Core Components

### 2.1 Exercise Orchestrator (The Matrix)
A **Server Action** responsible for selecting and generating the next practice task.
- **Logic**: Implements the **Matrix Generation Strategy**.
- **Inputs**: Fetches `User_Weakness_Buffer` and history directly from Supabase within the server context.
- **Modes**: Full Essay, Micro-Tasks (Intro-Boost, Argument-Build, etc.).

### 2.2 Grading Engine (The Strict Examiner)
A specialized **Route Handler** (for streaming) or **Server Action** that evaluates submissions.
- **Security**: The Gemini API key is accessed via server-side environment variables.
- **Evaluation Pillars**: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.
- **Output**: Returns structured JSON for the database and a stream for the UI.

### 2.3 Adaptive Feedback Loop (The Buffer)
Server-side logic that executes after grading to update user state.
- **Workflow**: 
    1. Extract `top_3_weaknesses` from the grading result.
    2. Perform an atomic update to `users.weakness_buffer` in Supabase.

---

## 3. Data Flow

### A. The Practice Lifecycle
1. **Request**: User clicks "Start Practice".
2. **Generation**: 
    - Client invokes a **Server Action**.
    - The action fetches user state from Supabase, calls Gemini, and returns the prompt.
3. **Submission**: User submits their text.
4. **Grading & Streaming**:
    - Client posts to a **Route Handler**.
    - The handler streams the critique back to the client while simultaneously triggering a background task to save the session.
5. **State Update**:
    - Feedback saved to `practice_sessions`.
    - `weakness_buffer` updated in the `users` table via server-side logic.

---

## 4. Database Schema (Supabase/Postgres)

### `users` (Managed via Auth + Profile Trigger)
| Column | Type | Description |
| --- | --- | --- |
| `id` | UUID | Primary Key (Link to auth.users) |
| `weakness_buffer` | JSONB | `{ "grammar_point": weight_score }` |
| `mastered_vocab` | TEXT[] | Words used correctly 3+ times |

### `practice_sessions`
| Column | Type | Description |
| --- | --- | --- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | Foreign Key -> `users.id` |
| `type` | Enum | FULL_ESSAY, SHORT_INTRO, etc. |
| `category` | String | Social, Tech, Culture |
| `prompt_text` | Text | The AI generated question |
| `user_response` | Text | The user's writing |
| `feedback` | JSONB | Scores (1-9), improvements, and weaknesses |
| `created_at` | TIMESTAMPTZ | Creation time |

---

## 5. AI Prompting Strategy

### The "System Persona"
1. **The Architect (Generation)**: Injected into the Server Action prompt to ensure variety and adaptive challenge.
2. **The Examiner (Grading)**: Injected into the Route Handler prompt for rigorous, rubric-based evaluation.

### Structured Output
We use Gemini's **Schema/JSON mode** for generation and state extraction to ensure robust parsing in server-side logic.

---

## 6. Implementation Milestones (1-Day Build)

1. **Phase 1: Foundation**: Supabase setup + Next.js App Router scaffolding + Shadcn UI.
2. **Phase 2: Secure AI**: Implement Server Actions for generation and Route Handlers for streaming feedback.
3. **Phase 3: The Buffer**: Connect the feedback loop to Supabase JSONB fields.
4. **Phase 4: Polish**: UI for "Weakness Visualization" and progress history.
