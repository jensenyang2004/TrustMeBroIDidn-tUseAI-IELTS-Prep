import { supabase } from "./supabase";
import { ImprovementNote } from "./schema";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export interface VaultItem extends ImprovementNote {
  id: string;
}

export const getVault = async (): Promise<VaultItem[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return [];

  const response = await fetch(`${API_URL}/api/vault`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) return [];
  return response.json();
};

export const addToVault = async (note: ImprovementNote) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_URL}/api/vault`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(note),
  });
  return response.ok;
};

export const removeFromVault = async (id: string | number) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_URL}/api/vault/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return response.ok;
};
