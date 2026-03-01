import os
import json
import sys
import base64
from google import genai
from google.genai import types
from dotenv import load_dotenv
# Ensure modules in parent directory can be found
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from grading_prompt import build_prompt

# Ensure models can be imported from backend folder
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from models import GradingResponse

# Load env
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env.local"))

api_key = os.getenv("NEXT_PUBLIC_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

def load_task_image(task_id: str, task_folder: str) -> types.Part | None:
    """Load a task image as a Gemini-compatible Part, or return None if not found."""
    image_path = os.path.join(task_folder, f"{task_id}.png")
    if not os.path.exists(image_path):
        print(f"   ⚠️  Image not found: {image_path}")
        return None
    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")
    return types.Part.from_bytes(data=base64.standard_b64decode(image_data), mime_type="image/png")

def main():
    dataset_path = os.path.join(os.path.dirname(__file__), "../data/grading_dataset.json")
    task_folder   = os.path.join(os.path.dirname(__file__), "../data/task")
    template_path = os.path.join(os.path.dirname(__file__), "../data/prompt.md")

    # Load resources
    try:
        with open(dataset_path, "r") as f:
            dataset = json.load(f)[:4]
        with open(template_path, "r") as f:
            prompt_template = f.read()
    except FileNotFoundError as e:
        print(f"❌ Error loading files: {e}")
        return

    print(f"🚀 Starting Python Band Accuracy Test on {len(dataset)} samples...\n")

    total_diff = 0
    matches = 0
    within_half = 0
    successful_tests = 0

    for index, item in enumerate(dataset):
        task_id = str(item["task"])
        task_type = "Task 1" if task_id.startswith("1") else "Task 2"
        expected_band = float(item["band_score"])

        print(f"📝 Testing Task {task_id} (Script {item.get('script_id', 'Unknown')}) - Expected Band: {expected_band}")

        # Load the task image
        image_part = load_task_image(task_id, task_folder)
        if image_part is None:
            print(f"   ⏭️  Skipping — no image available for task {task_id}")
            continue

        text_part = build_prompt(task_type=task_type, script_text=item['script_text'])


        try:
            response = client.models.generate_content(
                model="gemini-3-flash-preview",
                contents=[image_part, text_part],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GradingResponse
                )
            )

            result = json.loads(response.text)
            print(result)

            actual_band = float(result["overall_band_score"])
            diff = abs(actual_band - expected_band)
            total_diff += diff
            successful_tests += 1

            if diff == 0:
                matches += 1
            if diff <= 0.5:
                within_half += 1

            print(f"   ✅ AI Band: {actual_band} (Diff: {diff})")


        except json.JSONDecodeError:
            print("   ❌ Failed: Model did not return valid JSON.")
        except Exception as e:
            print(f"   ❌ Failed to test sample: {e}")

    # Final Results
    print("\n--- Final Results (Python) ---")
    print(f"Total Attempted: {len(dataset)}")
    print(f"Successful API Calls: {successful_tests}")

    if successful_tests > 0:
        avg_diff = total_diff / successful_tests
        print(f"Exact Matches: {matches} ({(matches/successful_tests)*100:.1f}%)")
        print(f"Within 0.5 Band: {within_half} ({(within_half/successful_tests)*100:.1f}%)")
        print(f"Average Band Difference: {avg_diff:.2f}")
    else:
        print("No successful tests to calculate metrics.")

if __name__ == "__main__":
    main()