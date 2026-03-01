import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export type PracticeType = 'INTRO_BOOST' | 'ARGUMENT_BUILD' | 'DATA_SNAP' | 'VOCAB_SWAP';

export interface UserBuffer {
  weaknesses: Record<string, number>;
  mastered_vocab: string[];
}

export const getBuffer = (): UserBuffer => {
  if (typeof window === "undefined") return { weaknesses: {}, mastered_vocab: [] };
  const saved = localStorage.getItem("ielts_vibe_buffer");
  return saved ? JSON.parse(saved) : { weaknesses: {}, mastered_vocab: [] };
};

export const updateBuffer = (newWeaknesses: string[]) => {
  const buffer = getBuffer();
  newWeaknesses.forEach(w => {
    buffer.weaknesses[w] = (buffer.weaknesses[w] || 0) + 1;
  });
  localStorage.setItem("ielts_vibe_buffer", JSON.stringify(buffer));
};

export async function generateShortPractice(type?: PracticeType) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const buffer = getBuffer();
  const topWeaknesses = Object.entries(buffer.weaknesses)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([w]) => w);

  const response = await fetch(`${API_URL}/api/practice`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ 
      type: type,
      weaknesses: topWeaknesses 
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate practice task via Flask backend");
  }

  return response.json();
}
