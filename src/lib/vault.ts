import { ImprovementNote } from "./schema";

export interface VaultItem extends ImprovementNote {
  id: string;
}

export const getVault = async (): Promise<VaultItem[]> => {
  const response = await fetch("http://localhost:5001/api/vault");
  if (!response.ok) return [];
  return response.json();
};

export const addToVault = async (note: ImprovementNote) => {
  const response = await fetch("http://localhost:5001/api/vault", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(note),
  });
  return response.ok;
};

export const removeFromVault = async (id: string | number) => {
  const response = await fetch(`http://localhost:5001/api/vault/${id}`, {
    method: "DELETE",
  });
  return response.ok;
};
