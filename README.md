# QUORAI

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed?style=flat-square)](./LICENSE)

**AI-powered web research.**

QUORAI searches the open web, ranks sources, and streams a cited brief. It supports Quick Search, Deep Research, and follow-up questions. Demo mode works with no API keys.

---

## Product overview

- **Quick Search** — grounded answers from top sources
- **Deep Research** — wider retrieval and denser synthesis
- **Streaming** — tokens appear as the brief is composed
- **Citations** — expandable source cards with credibility + relevance
- **Follow-ups** — conversation context stays on the thread
- **Accounts** — signup / sign-in with httpOnly sessions
- **Demo mode** — full UI without vendor keys

---

## Architecture

```text
src/
  app/                     # App Router pages + API routes
    api/research/          # SSE research pipeline
    api/auth/              # signup, login, logout, me
    api/leads/             # waitlist + contact
    solutions/ models/ contact/
    research/[id]/         # Research workspace
  components/
    brand/ marketing/ layout/ search/ research/ ui/ auth/ providers/
  lib/
    providers/search/      # Tavily | Serper | mock
    providers/llm/         # OpenAI | Anthropic | mock
    research/              # Pipeline, prompts, client
    auth/                  # sessions, hashing, user store
    store/                 # Zustand history + sessions
```

**Flow**

1. Client creates a session and routes to `/research/[id]`
2. `POST /api/research` streams SSE (`stage`, `sources`, `token`, `follow_ups`, `done`)
3. Zustand applies events
4. UI renders pipeline HUD, streamed answer, evidence, follow-ups

Search and LLM vendors are selected from environment variables — not hard-wired.

---

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Zustand, Zod, Framer Motion

---

## Environment variables

Copy `.env.example` → `.env.local`:

| Variable | Description |
| --- | --- |
| `SEARCH_PROVIDER` | `auto` \| `mock` \| `tavily` \| `serper` |
| `LLM_PROVIDER` | `auto` \| `mock` \| `openai` \| `anthropic` |
| `TAVILY_API_KEY` | Tavily search key |
| `SERPER_API_KEY` | Serper search key |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI chat + model |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Anthropic chat + model |
| `AUTH_SECRET` | Secret used to sign session cookies |
| `QUORAI_API_KEY` | Optional Bearer token for list/admin APIs |
| `CONTACT_WEBHOOK_URL` | Optional Slack/Make webhook for leads |
| `CORS_ORIGIN` | Optional allowed origin for `/api` |
| `LOG_LEVEL` | Optional: `debug` \| `info` \| `warn` \| `error` |
| `RESEARCH_RATE_LIMIT` | Optional requests per window (default `30`) |
| `RESEARCH_RATE_WINDOW_MS` | Optional window ms (default `60000`) |

With no keys configured, QUORAI uses mock providers automatically.

---

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

---

## API

Base: `/api` · Discovery: `GET /api` · Docs UI: `/developers`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness, providers, persistence |
| `GET` | `/api/catalog` | Solutions + models |
| `POST` | `/api/research` | SSE research pipeline |
| `GET` | `/api/briefs/:id` | Persisted brief |
| `GET` | `/api/briefs` | List briefs (signed-in or API key) |
| `POST` | `/api/leads/waitlist` | Beta waitlist |
| `POST` | `/api/leads/contact` | Contact desk |
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/logout` | Sign out |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/admin/leads` | Waitlist + contacts (`QUORAI_API_KEY`) |

`POST /api/research`

```json
{
  "query": "Compare RAG architectures for production chatbots",
  "mode": "deep",
  "sessionId": "optional-id",
  "attachments": [{ "name": "notes.md", "text": "..." }],
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

Response: `text/event-stream` (`stage`, `sources`, `token`, `follow_ups`, `done`). Live provider failures fall back to mock synthesis. Briefs are stored server-side (disk locally, memory on read-only hosts).

Optional: `Authorization: Bearer $QUORAI_API_KEY`. Optional `CONTACT_WEBHOOK_URL` forwards waitlist and contact events.

---

## Deployment

**Use Vercel.** It is the native host for Next.js (streaming, App Router, env vars, preview URLs).

1. Push this repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add env vars from `.env.example` (`AUTH_SECRET`, optional search/LLM keys)
4. Deploy

```bash
npx vercel
```

Public URL will look like `https://quorai.vercel.app`.

**Also works on:** Netlify, Railway, or any Node 20+ host with `npm run build && npm start`. For a GitHub resume demo, Vercel is the fastest path.

---

## Future improvements

- Redis-backed rate limits and briefs
- Claim-level citation highlighting
- Team workspaces

---

## License

MIT — see [LICENSE](./LICENSE).
