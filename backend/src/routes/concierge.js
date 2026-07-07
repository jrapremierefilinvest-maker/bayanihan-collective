import { Router } from "express";
import { classifyIntent } from "../services/fireworks.js";
import { generateReply } from "../services/claude.js";

const router = Router();

// Two-layer pipeline: Gemma (Fireworks) classifies intent first, then Claude
// generates the actual conversational reply, informed by that classification.
router.post("/message", async (req, res) => {
  const { message, history } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  const classification = await classifyIntent(message);
  const { reply, source } = await generateReply(message, {
    intent: classification.intent,
    history,
  });

  res.json({
    reply,
    replySource: source,
    classification,
  });
});

export default router;
