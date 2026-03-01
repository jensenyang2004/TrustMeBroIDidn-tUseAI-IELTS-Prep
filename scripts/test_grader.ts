import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import { GradingResponseSchema } from "../src/lib/schema";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
  const datasetPath = path.join(__dirname, "../data/grading_dataset.json");
  const promptsPath = path.join(__dirname, "../data/task/prompts.json");
  const promptTemplatePath = path.join(__dirname, "../data/prompt.md");

  if (!fs.existsSync(datasetPath)) {
    console.log("Skipping test: dataset not found.");
    return;
  }

  const datasetFull = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
  const dataset = datasetFull.slice(0, 3);
  const taskPrompts = JSON.parse(fs.readFileSync(promptsPath, "utf-8"));
  const promptTemplate = fs.readFileSync(promptTemplatePath, "utf-8");

  console.log(`🚀 Starting Band Accuracy Test on ${dataset.length} samples...\n`);

  let totalDiff = 0;
  let matches = 0;
  let withinHalfBand = 0;

  for (const item of dataset) {
    const isTask1 = item.task.startsWith("1");
    const taskType = isTask1 ? "task1" : "task2";
    const taskPrompt = taskPrompts[item.task];
    const candidateSubmission = item.script_text;
    const expectedBand = item.band_score;

    console.log(`📝 Testing Task ${item.task} (Script ${item.script_id}) - Expected Band: ${expectedBand}`);

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const schema = {
        type: "object",
        properties: {
          task_type: { type: "string", enum: ["task1", "task2"] },
          overall_band_score: { type: "number" },
          justification: { type: "string" },
          pillars: {
            type: "object",
            properties: {
              task_achievement: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } } },
              task_response: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } } },
              coherence_cohesion: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
              lexical_resource: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] },
              grammatical_range_accuracy: { type: "object", properties: { score: { type: "number" }, feedback: { type: "string" } }, required: ["score", "feedback"] }
            },
            required: ["coherence_cohesion", "lexical_resource", "grammatical_range_accuracy"]
          },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                original: { type: "string" },
                issue: { type: "string" },
                suggestion: { type: "string" },
                error_type: { type: "string", enum: ["grammar", "vocabulary", "structure", "coherence", "punctuation", "spelling"] }
              },
              required: ["original", "issue", "suggestion", "error_type"]
            }
          },
          improvement_notes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["vocabulary_upgrade", "restructure", "formality_adjustment", "conciseness", "coherence_link", "task_fulfilment", "data_precision"] },
                before: { type: "string" },
                after: { type: "string" },
                reason: { type: "string" }
              },
              required: ["type", "before", "after", "reason"]
            }
          },
          improved_version: { type: "string" },
          self_check: { type: "string" }
        },
        required: ["task_type", "overall_band_score", "justification", "pillars", "errors", "improvement_notes", "improved_version", "self_check"]
      };

      const fullPrompt = `${promptTemplate}
      
Input Data:
* **Task Type**: ${taskType}
* **Task Prompt**: ${taskPrompt}
* **Candidate Submission**: ${candidateSubmission}

IMPORTANT: Respond strictly with a JSON object following this JSON schema:
${JSON.stringify(schema, null, 2)}
`;

      const result = await model.generateContent(fullPrompt);
      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);
      
      // Validate schema
      const validation = GradingResponseSchema.safeParse(parsed);
      if (!validation.success) {
        console.error("❌ Schema Validation Failed", validation.error.format());
        continue;
      }

      const actualBand = validation.data.overall_band_score;
      const diff = Math.abs(actualBand - expectedBand);
      totalDiff += diff;

      if (diff === 0) matches++;
      if (diff <= 0.5) withinHalfBand++;

      console.log(`   ✅ AI Band: ${actualBand} (Diff: ${diff})`);
    } catch (error) {
      console.error(`   ❌ Failed to test sample:`, error);
    }
  }

  if (dataset.length > 0) {
    const avgDiff = totalDiff / dataset.length;
    const accuracy = (matches / dataset.length) * 100;
    const toleranceAccuracy = (withinHalfBand / dataset.length) * 100;

    console.log("\n--- Final Results ---");
    console.log(`Total Samples: ${dataset.length}`);
    console.log(`Exact Matches: ${matches} (${accuracy.toFixed(2)}%)`);
    console.log(`Within 0.5 Band: ${withinHalfBand} (${toleranceAccuracy.toFixed(2)}%)`);
    console.log(`Average Band Difference: ${avgDiff.toFixed(2)}`);
  }
}

main().catch(console.error);
