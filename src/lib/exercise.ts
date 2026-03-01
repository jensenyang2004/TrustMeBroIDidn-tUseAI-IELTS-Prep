import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export interface Exercise {
  category: string;
  subcategory: string;
  topic: string;
  instruction: string;
  stimulus: string;
}

export interface ErrorAnnotation {
  original: string;
  issue: string;
  suggestion: string;
  error_type: "grammar" | "vocabulary" | "structure" | "coherence" | "task";
}

export interface ImprovementNote {
  type: "vocabulary_upgrade" | "restructure" | "formality_adjustment" | "conciseness" | "coherence_link" | "task_fulfilment" | "data_precision";
  before: string;
  after: string;
  reason: string;
}

export interface ExerciseGradingResponse {
  task_completion: "complete" | "partial" | "off-task";
  errors: ErrorAnnotation[];
  feedback_summary: string;
  improved_version: string;
  improvement_notes: ImprovementNote[];
  question?: Exercise;
  user_answer?: string;
}

export const EXERCISE_CATEGORIES = {
  "lexical_resource": "Lexical Resource",
  "grammatical_range": "Grammatical Range",
  "argument_development": "Argument Development",
  "data_translation": "Data Translation",
  "functional_communication": "Functional Communication",
  "cohesion_coherence": "Cohesion & Coherence",
};

export async function generateExercise(category: string, subcategory?: string): Promise<Exercise> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_URL}/api/exercise/generate`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ category, subcategory }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate exercise");
  }

  return response.json();
}

export async function gradeExercise(question: Exercise, user_answer: string): Promise<ExerciseGradingResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_URL}/api/exercise/grade`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ question, user_answer }),
  });

  if (!response.ok) {
    throw new Error("Failed to grade exercise");
  }

  return response.json();
}
