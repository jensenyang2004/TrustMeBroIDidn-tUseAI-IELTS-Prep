export async function gradeSubmission(
  promptText: string, 
  userResponse: string, 
  taskType: "task1" | "task2" = "task2",
  imageFile?: File | null
) {
  let body: any;
  let headers: any = {};

  if (taskType === "task1" && imageFile) {
    // One-step vision approach: send as FormData
    const formData = new FormData();
    formData.append("prompt_text", promptText);
    formData.append("user_response", userResponse);
    formData.append("task_type", taskType);
    formData.append("image", imageFile);
    body = formData;
    // Don't set Content-Type header, fetch will do it automatically for FormData
  } else {
    // Standard Task 2 or Task 1 without image: send as JSON
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ 
      prompt_text: promptText, 
      user_response: userResponse,
      task_type: taskType
    });
  }

  const response = await fetch("http://localhost:5001/api/grade", {
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

  const response = await fetch("http://localhost:5001/api/task1/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to analyze Task 1 image");
  }

  return response.json();
}
