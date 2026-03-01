import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export async function gradeSubmission(
  promptText: string, 
  userResponse: string, 
  taskType: "task1" | "task2" = "task2",
  imageFile?: File | null
) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  let body: any;
  let headers: any = {
    "Authorization": `Bearer ${token}`
  };

  if (taskType === "task1" && imageFile) {
    const formData = new FormData();
    formData.append("prompt_text", promptText);
    formData.append("user_response", userResponse);
    formData.append("task_type", taskType);
    formData.append("image", imageFile);
    body = formData;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ 
      prompt_text: promptText, 
      user_response: userResponse,
      task_type: taskType
    });
  }

  const response = await fetch(`${API_URL}/api/grade`, {
    method: "POST",
    headers: headers,
    body: body,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to grade submission via Flask backend");
  }

  return response.json();
}

export async function analyzeTask1Image(imageFile: File): Promise<{ description: string }> {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch(`${API_URL}/api/task1/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze Task 1 image");
  }

  return response.json();
}
