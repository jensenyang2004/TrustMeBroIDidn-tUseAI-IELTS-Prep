import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import { GradingResponseSchema } from "../src/lib/schema";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
console.log(`Debug: API Key present: ${!!apiKey}, Length: ${apiKey.length}`);
const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
  const datasetPath = path.join(__dirname, "../data/grading_dataset.json");
  const promptsPath = path.join(__dirname, "../data/task/prompts.json");
  const promptTemplatePath = path.join(__dirname, "../data/prompt.md");

  const datasetFull = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
  const dataset = datasetFull.slice(0, 3);
  const taskPrompts = JSON.parse(fs.readFileSync(promptsPath, "utf-8"));
  const promptTemplate = fs.readFileSync(promptTemplatePath, "utf-8");

  console.log(`🚀 Starting Band Accuracy Test on ${dataset.length} samples...
`);

  let totalDiff = 0;
  let matches = 0;
  let withinHalfBand = 0;

  for (const item of dataset) {
    const taskType = item.task.startsWith("1") ? "Task 1" : "Task 2";
    const taskPrompt = taskPrompts[item.task];
    const candidateSubmission = item.script_text;
    const expectedBand = item.band_score;

    console.log(`📝 Testing Task ${item.task} (Script ${item.script_id}) - Expected Band: ${expectedBand}`);

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const schema = {
        type: "object",
        properties: {
          band_score: { type: "number" },
          justification: { type: "string" },
          pillars: {
            type: "object",
            properties: {
              [taskType === "Task 1" ? "task_achievement" : "task_response"]: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  feedback: { type: "string" }
                },
                required: ["score", "feedback"]
              },
              coherence_cohesion: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  feedback: { type: "string" }
                },
                required: ["score", "feedback"]
              },
              lexical_resource: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  feedback: { type: "string" }
                },
                required: ["score", "feedback"]
              },
              grammatical_range_accuracy: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  feedback: { type: "string" }
                },
                required: ["score", "feedback"]
              }
            },
            required: ["coherence_cohesion", "lexical_resource", "grammatical_range_accuracy", taskType === "Task 1" ? "task_achievement" : "task_response"]
          },
          corrections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                original: { type: "string" },
                improved: { type: "string" },
                reason: { type: "string" }
              },
              required: ["original", "improved", "reason"]
            }
          },
          top_3_weaknesses: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
          actionable_improvements: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 }
        },
        required: ["band_score", "justification", "pillars", "corrections", "top_3_weaknesses", "actionable_improvements"]
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
        console.log("AI Response was:", responseText);
        continue;
      }

      if (item === dataset[0]) {
        console.log("   📝 AI Justification:", validation.data.justification);
      }

      const actualBand = validation.data.band_score;
      const diff = Math.abs(actualBand - expectedBand);
      totalDiff += diff;

      if (diff === 0) matches++;
      if (diff <= 0.5) withinHalfBand++;

      console.log(`   ✅ AI Band: ${actualBand} (Diff: ${diff})`);
    } catch (error) {
      console.error(`   ❌ Failed to test sample:`, error);
    }
  }

  const avgDiff = totalDiff / dataset.length;
  const accuracy = (matches / dataset.length) * 100;
  const toleranceAccuracy = (withinHalfBand / dataset.length) * 100;

  console.log("\n--- Final Results ---");
  console.log(`Total Samples: ${dataset.length}`);
  console.log(`Exact Matches: ${matches} (${accuracy.toFixed(2)}%)`);
  console.log(`Within 0.5 Band: ${withinHalfBand} (${toleranceAccuracy.toFixed(2)}%)`);
  console.log(`Average Band Difference: ${avgDiff.toFixed(2)}`);
}

main().catch(console.error);
