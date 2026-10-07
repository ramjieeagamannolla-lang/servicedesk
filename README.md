# ServiceDesk Pro — AI-Powered IT Helpdesk & Asset Management

A full-stack ITSM platform: ticket management with AI-assisted triage, real SLA tracking,
an IT asset lifecycle module, a knowledge base, role-based access control, notifications,
and an audit trail.

```
servicedesk-pro/
├── backend/    Node.js + Express + MongoDB API
└── frontend/   React + Vite + Tailwind CSS
```

## 1. Prerequisites

- Node.js 18+
- A MongoDB connection string (local MongoDB, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, and (optionally) an AI provider key
npm install
npm run seed   # wipes and populates the database with demo data — see accounts below
npm run dev    # starts the API on http://localhost:5000
```

`GET http://localhost:5000/api/health` should return `{ "success": true, ... }`.

### AI provider (optional)

Set `AI_PROVIDER` in `.env` to `groq`, `gemini`, or `none`.

- `groq` / `gemini` — set `GROQ_API_KEY` or `GEMINI_API_KEY`. If the call fails or the key is
  missing, the API **automatically falls back** to a rule-based classifier — the app never
  breaks because of the AI provider.
- `none` — always uses the rule-based fallback classifier. Good for a demo you don't want to
  depend on network access.

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# edit .env if your API isn't on localhost:5000
npm install
npm run dev    # starts on http://localhost:5173
```

## 4. Demo accounts

Created by `npm run seed` in the backend:

| Role           | Email                | Password      |
|----------------|-----------------------|---------------|
| System Admin   | admin@demo.com        | Admin@123     |
| IT Manager     | manager@demo.com      | Manager@123   |
| Technician     | technician@demo.com   | Tech@123      |
| Technician     | tech2@demo.com         | Tech@123      |
| Technician     | tech3@demo.com         | Tech@123      |
| Employee       | employee@demo.com     | Employee@123  |
| Employee       | employee2–5@demo.com  | Employee@123  |
| Asset Manager  | asset@demo.com        | Asset@123     |

The seed script also creates 6 departments, 9 categories, 4 SLA tiers, 18 assets, 11 knowledge
base articles, and 24 tickets spanning the full lifecycle (including a few intentionally
SLA-breached tickets so the dashboard isn't all green).

## 5. Suggested live demo flow

1. **Employee** (`employee@demo.com`) → *New Ticket* → title "VPN is not connecting", description
   "My VPN is not connecting and I have an important client meeting in 30 minutes." Submit and
   watch the AI Analysis panel populate instantly (Category: VPN, Priority: CRITICAL, suggested
   steps, related knowledge article).
2. **Technician** (`technician@demo.com`) → open the ticket → *Accept* → add a work log → move to
   *In Progress* → *Resolve Ticket* with a resolution summary.
3. **Employee** → open the same ticket → *Confirm Resolution* → ticket closes.
4. **IT Manager** (`manager@demo.com`) → *Dashboard* → show updated stats, SLA performance, and
   technician workload.

## 6. Deploying the backend to Render

1. Push this repo to GitHub.
2. New Web Service on Render → point at `backend/`.
3. Build command: `npm install` — Start command: `npm start`.
4. Environment variables: `MONGO_URI` (Atlas), `JWT_SECRET`, `CLIENT_URL` (your deployed
   frontend origin, e.g. `https://your-app.vercel.app`), `AI_PROVIDER`, and the relevant API key.
5. Render sets `PORT` automatically — the server already binds to `0.0.0.0:$PORT`.
6. After deploying, run the seed script once against the Atlas database (locally, with
   `MONGO_URI` pointed at Atlas): `npm run seed`.
7. Confirm `https://your-backend.onrender.com/api/health` responds.

## 7. Deploying the frontend

Any static host (Vercel, Netlify, Render static site) works:

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`

## 8. What's intentionally simplified for the hackathon scope

- File attachments are stored as metadata (`fileName`/`fileUrl`) rather than wired to an actual
  object-storage upload — swap in S3/Cloudinary if you need real file uploads.
- SLA breach detection runs on-demand via `POST /api/sla/check` (also callable from Settings →
  "Run SLA Check") rather than a persistent background cron, since Render's free tier doesn't
  guarantee a long-running process. Point an external scheduler (e.g. cron-job.org) at that
  endpoint for production use.
- The AI classifier is intentionally provider-agnostic and always has a full rule-based fallback
  — this was a hard requirement so the demo never depends on a live API key.
