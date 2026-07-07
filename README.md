# Bayanihan Collective

A cooperative operations + AI concierge platform scaffold for **independent AI developers**,
built for the AMD Developer Hackathon (Unicorn Track).

This is a **member-owned cooperative model** — not a commission-based freelance marketplace.
Members hold a stake in governance, share resources, and resolve disputes through a tiered
peer-mediation process rather than a platform taking a cut of every engagement.

## What's here

A single-page app with one shell/nav and three views:

1. **Ops Dashboard** — case tracking for cooperative members. Tracks Case ID, Developer Name,
   Specialization, Case Type, Status (`Waiting → Under Review → Escalated → Resolved`), Assigned
   Mediator, Due Date, and Priority, with a 3-tier escalation model (Routine / Escalate to Peer
   Mediator / Escalate to Coop Board). Call/Email/Text buttons are **mock/log-only** — nothing is
   actually sent.
2. **Training Simulator** — a "Welcome to the Collective" onboarding practice module: session
   setup (audience mode + topic), a live practice view with a pausable timer, a reactive AI
   audience panel with sentiment tags, a Q&A bank, and session history.
3. **Member Concierge** — a chat widget for welcoming new members and answering general
   questions. Uses a two-layer AI pipeline: **Gemma (via Fireworks AI)** classifies intent first,
   visibly shown in the UI as a badge (e.g. "Gemma classified: onboarding_inquiry (94%) → routing
   to Claude"), then **Claude** generates the actual reply.

All seed data (developer names, cases, training content) is fictional, created for this scaffold.

## Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Orchestration:** Docker Compose
- **License:** MIT

## Project structure

```
bayanihan-collective/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── routes/         # cases, training, concierge
│       ├── services/       # claude.js, fireworks.js
│       └── data/           # seed JSON (cases, training content)
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── index.html
    └── src/
        ├── App.jsx
        ├── api/            # fetch client for the backend
        ├── components/     # Nav, CaseTable, ChatWidget, AudiencePanel, etc.
        └── views/           # OpsDashboard, TrainingSimulator, MemberConcierge
```

## Running locally

### With Docker Compose (recommended)

```bash
cp .env.example .env
# fill in ANTHROPIC_API_KEY and FIREWORKS_API_KEY (both are optional for the demo — see below)
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

### Without Docker

```bash
# backend
cd backend
npm install
cp ../.env.example .env
npm run dev

# frontend, in a second terminal
cd frontend
npm install
npm run dev
```

## Running without API keys

The backend works without live API keys: if `ANTHROPIC_API_KEY` or `FIREWORKS_API_KEY` is unset,
the concierge falls back to a local keyword-based intent classifier and canned-but-intent-aware
replies, so the full demo flow (including the classification badge) still works end-to-end for
judging or offline development.

## API overview

| Method | Path                          | Description                                  |
|--------|-------------------------------|-----------------------------------------------|
| GET    | `/api/cases`                  | List all cases                                |
| GET    | `/api/cases/stats`            | Total/waiting/escalated/resolved counts       |
| PATCH  | `/api/cases/:id`               | Update status, tier, mediator, or priority    |
| POST   | `/api/cases/:id/actions`       | Log a mock call/email/text                    |
| POST   | `/api/cases/:id/notify`        | Trigger a real SMS/Email follow-up via an n8n webhook (mock success if `N8N_WEBHOOK_URL` unset) |
| GET    | `/api/training/modules`       | Onboarding module content                     |
| GET    | `/api/training/audience-modes`| Available AI audience modes                   |
| GET    | `/api/training/qa-bank`       | Q&A bank, optionally filtered by module        |
| GET    | `/api/training/sessions`      | Practice session history                      |
| POST   | `/api/training/sessions`      | Log a completed practice session              |
| POST   | `/api/concierge/message`      | Send a chat message (Gemma classify → Claude reply) |

## Notes for hackathon judging

- The Ops Dashboard's Call/Email/Text buttons are mock/log-only — actions are logged in-memory only.
  A separate `POST /api/cases/:id/notify` endpoint exists for real n8n-triggered SMS/Email
  follow-ups; it degrades gracefully to a mock success when `N8N_WEBHOOK_URL` is unset.
- All case, developer, and training data is seeded fiction; it resets on backend restart.
- The Gemma → Claude pipeline is designed to degrade gracefully without API keys, but will use the
  real APIs the moment credentials are supplied in `.env`.
