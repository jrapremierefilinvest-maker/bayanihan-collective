import { Router } from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, "..", "data", "cases.seed.json");

// In-memory store seeded from JSON. Resets on server restart — fine for a hackathon demo.
const cases = JSON.parse(readFileSync(seedPath, "utf-8")).map((c) => ({
  ...c,
  actionLog: [],
}));

const router = Router();

router.get("/", (_req, res) => {
  res.json(cases);
});

router.get("/stats", (_req, res) => {
  const stats = {
    total: cases.length,
    waiting: cases.filter((c) => c.status === "Waiting").length,
    underReview: cases.filter((c) => c.status === "Under Review").length,
    escalated: cases.filter((c) => c.status === "Escalated").length,
    resolved: cases.filter((c) => c.status === "Resolved").length,
  };
  res.json(stats);
});

router.get("/:id", (req, res) => {
  const found = cases.find((c) => c.id === req.params.id);
  if (!found) return res.status(404).json({ error: "Case not found" });
  res.json(found);
});

router.patch("/:id", (req, res) => {
  const found = cases.find((c) => c.id === req.params.id);
  if (!found) return res.status(404).json({ error: "Case not found" });

  const { status, escalationTier, assignedMediator, priority } = req.body;
  if (status) found.status = status;
  if (escalationTier) found.escalationTier = escalationTier;
  if (assignedMediator) found.assignedMediator = assignedMediator;
  if (priority) found.priority = priority;

  res.json(found);
});

// Mock-only action log: no real call/email/text is sent, this just records intent.
router.post("/:id/actions", (req, res) => {
  const found = cases.find((c) => c.id === req.params.id);
  if (!found) return res.status(404).json({ error: "Case not found" });

  const { type } = req.body;
  if (!["call", "email", "text"].includes(type)) {
    return res.status(400).json({ error: "type must be call, email, or text" });
  }

  const entry = {
    type,
    timestamp: new Date().toISOString(),
    note: `Mock ${type} logged for ${found.developerName} — no message was actually sent.`,
  };
  found.actionLog.push(entry);

  res.status(201).json(entry);
});

// POST /:id/notify — trigger a follow-up SMS/Email via an n8n webhook.
// Reads the webhook URL from N8N_WEBHOOK_URL; falls back to a mock success
// when it's unset so this works with zero configuration.
router.post("/:id/notify", async (req, res, next) => {
  try {
    const found = cases.find((c) => c.id === req.params.id);
    if (!found) return res.status(404).json({ error: "Case not found" });

    const channel = (req.body && req.body.channel) || "email";
    if (!["sms", "email"].includes(channel)) {
      return res.status(400).json({ error: 'channel must be "sms" or "email"' });
    }
    const message =
      (req.body && req.body.message) ||
      `Follow-up on case ${found.id} (${found.caseType}) — current status: ${found.status}.`;

    const payload = {
      caseId: found.id,
      developerName: found.developerName,
      channel,
      message,
      timestamp: new Date().toISOString(),
    };

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn(
        "[notify] N8N_WEBHOOK_URL is not set — returning mock success so local testing works without an n8n account"
      );
      return res.json({
        success: true,
        mock: true,
        detail: "N8N_WEBHOOK_URL not configured; no webhook was called",
        payload,
      });
    }

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      return res.status(502).json({
        success: false,
        error: `Webhook responded with status ${webhookResponse.status}`,
        payload,
      });
    }

    res.json({ success: true, mock: false, payload });
  } catch (err) {
    next(err);
  }
});

export default router;
