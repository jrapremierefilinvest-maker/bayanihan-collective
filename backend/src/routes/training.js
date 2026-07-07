import { Router } from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, "..", "data", "training.seed.json");

const trainingContent = JSON.parse(readFileSync(seedPath, "utf-8"));

// In-memory session history — resets on server restart.
const sessionHistory = [];

const router = Router();

router.get("/modules", (_req, res) => {
  res.json(trainingContent.modules);
});

router.get("/audience-modes", (_req, res) => {
  res.json(trainingContent.audienceModes);
});

router.get("/qa-bank", (req, res) => {
  const { moduleId } = req.query;
  const bank = moduleId
    ? trainingContent.qaBank.filter((q) => q.moduleId === moduleId)
    : trainingContent.qaBank;
  res.json(bank);
});

router.get("/sessions", (_req, res) => {
  res.json(sessionHistory);
});

router.post("/sessions", (req, res) => {
  const { moduleId, audienceMode, durationSeconds, sentimentSummary } = req.body;

  const session = {
    id: `SESSION-${Date.now()}`,
    moduleId,
    audienceMode,
    durationSeconds: durationSeconds || 0,
    sentimentSummary: sentimentSummary || null,
    completedAt: new Date().toISOString(),
  };

  sessionHistory.unshift(session);
  res.status(201).json(session);
});

export default router;
