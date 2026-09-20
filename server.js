import {
  loadModel,
  completion,
  unloadModel,
  QWEN3_600M_INST_Q4,
} from "@qvac/sdk";

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

let modelId = null;

async function ensureModelLoaded() {
  if (modelId) return modelId;

  console.log("Loading local Qwen3 0.6B Q4 model...");

  modelId = await loadModel({
    modelSrc: QWEN3_600M_INST_Q4,
    modelConfig: {
      ctx_size: 4096,
    },
    onProgress: (progress) => {
      if (progress?.percent !== undefined) {
        console.log(`Model loading: ${progress.percent}%`);
      }
    },
  });

  console.log("Local model loaded:", modelId);
  return modelId;
}

function parseResponse(text) {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("The local model did not return valid JSON.");
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1));

  return {
    summary: parsed.summary || "",
    problem: parsed.problem || "",
    solution: parsed.solution || "",
    targetUsers: Array.isArray(parsed.targetUsers)
      ? parsed.targetUsers
      : [],
    businessModel: Array.isArray(parsed.businessModel)
      ? parsed.businessModel
      : [],
    features: Array.isArray(parsed.features)
      ? parsed.features
      : [],
    mvpPlan: Array.isArray(parsed.mvpPlan)
      ? parsed.mvpPlan
      : [],
    risks: Array.isArray(parsed.risks)
      ? parsed.risks
      : [],
  };
}

async function generatePitch(idea) {
  const id = await ensureModelLoaded();

  const prompt = `
You are PitchForge, a private on-device startup pitch assistant.

Analyze the following rough business or startup idea:

${idea}

Return ONLY valid JSON.

Use exactly this structure:

{
  "summary": "short explanation of the idea",
  "problem": "the problem being solved",
  "solution": "how the product solves it",
  "targetUsers": ["user group 1", "user group 2"],
  "businessModel": ["revenue model 1", "revenue model 2"],
  "features": ["feature 1", "feature 2", "feature 3"],
  "mvpPlan": ["step 1", "step 2", "step 3"],
  "risks": ["risk 1", "risk 2"]
}

Keep the answer practical and concise.
Do not include markdown.
Do not include any text outside the JSON.
`;

  const result = completion({
    modelId: id,
    history: [
      {
        role: "system",
        content:
          "You are PitchForge, a private on-device startup planning assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: true,
  });

  const final = await result.final;

  const text =
    final?.contentText ||
    final?.raw?.fullText ||
    "";

  return parseResponse(text);
}

app.post("/api/generate", async (req, res) => {
  try {
    const idea = String(req.body?.idea || "").trim();

    if (!idea) {
      return res.status(400).json({
        error: "Please enter a business idea.",
      });
    }

    if (idea.length > 12000) {
      return res.status(400).json({
        error: "Idea is too long. Keep it under 12,000 characters.",
      });
    }

    const pitch = await generatePitch(idea);

    res.json({
      success: true,
      local: true,
      model: "Qwen3 600M",
      pitch,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message || "Failed to generate pitch.",
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    app: "PitchForge",
    local: true,
    qvac: true,
    modelLoaded: Boolean(modelId),
    model: "Qwen3 600M",
    sdk: "@qvac/sdk 0.19.1",
  });
});

async function shutdown() {
  try {
    if (modelId) {
      await unloadModel({
        modelId,
        clearStorage: false,
      });
    }
  } catch (error) {
    console.error("Shutdown error:", error);
  }

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

app.listen(PORT, () => {
  console.log(`PitchForge running at http://localhost:${PORT}`);
});
