# QUORAI 2.0

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed?style=flat-square)](./LICENSE)

**AI-powered web research with Failproof agent reliability.**

QUORAI retrieves multi-source evidence (Tavily primary), synthesizes a cited brief (OpenAI primary), and ships genuine runtime traces to the Failproof **quoraai** workspace. Mock answers are **opt-in only** (`ALLOW_MOCK_FALLBACK=1`) and are never presented as live research.

Production: [https://quorai-ecru.vercel.app](https://quorai-ecru.vercel.app)

---

## Product overview

- **Quick Search / Deep Research** — ranked sources + streamed cited brief
- **Citations & evidence** — source cards, citation confidence, PDF/text uploads
- **Failproof monitoring** — agent/tool/model events shipped to Cloud
- **Reliability console** — `/reliability` metrics, decisions, Cloud verify
- **Protected vs unprotected demo** — `/demo` side-by-side genuine runs
- **Accounts** — httpOnly sessions (requires real `AUTH_SECRET`)

---

## Architecture

```text
Browser → POST /api/research (SSE)
        → research/pipeline.ts
           ├─ search chain: Tavily → Serper (optional) → mock (opt-in)
           ├─ llm chain:    OpenAI → Anthropic (optional) → mock (opt-in)
           ├─ guards: loops, tool limits, evidence, citations, drift
           └─ Failproof SDK spool → POST /v1/events → quoraai workspace
```

| Layer | Primary | Optional fallback |
| --- | --- | --- |
| Search | Tavily | Serper |
| LLM | OpenAI | Anthropic |
| Reliability | Failproof Cloud (`quoraai`) | Local reliability records |

---

## Environment variables

Copy `.env.example` → `.env.local`:

| Variable | Required | Description |
| --- | --- | --- |
| `TAVILY_API_KEY` | Yes (live) | Primary search |
| `OPENAI_API_KEY` | Yes (live) | Primary LLM |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |
| `AUTH_SECRET` | Yes (auth) | Session signing (no hardcoded fallback) |
| `FAILPROOFAI_API_KEY` | Recommended | Ship traces (`events:add`) |
| `FAILPROOFAI_READ_API_KEY` | Optional | Cloud verify if ship key lacks `events:read` |
| `SEARCH_PROVIDER` | No | Default `tavily` |
| `LLM_PROVIDER` | No | Default `openai` |
| `ALLOW_MOCK_FALLBACK` | No | Default off. Set `1` only for labeled demos |
| `SERPER_API_KEY` / `ANTHROPIC_API_KEY` | No | Optional fallbacks |
| `QUORAI_API_KEY` | No | Bearer for list/admin APIs |

---

## Local development

```bash
npm install
cp .env.example .env.local
# Fill TAVILY_API_KEY, OPENAI_API_KEY, AUTH_SECRET, FAILPROOFAI_API_KEY
npm run dev
```

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check:providers
npm run verify:failproof   # needs FAILPROOFAI_API_KEY in env
npm run verify:research    # SSE smoke against BASE_URL (default: production)
```

If model APIs are billing-blocked, `verify:research` still passes when live search returns sources and an extractive brief. Add OpenAI or Anthropic credits for full model synthesis.

---

## Product walkthrough

See [docs/PRODUCT_WALKTHROUGH.md](./docs/PRODUCT_WALKTHROUGH.md) for the operator tour (`/demo`, `/reliability`, Failproof dashboard), including the extractive-brief path when LLM billing blocks synthesis.

---

## API

Discovery: `GET /api` · Docs UI: `/developers`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health?failproof=1` | Liveness + credential + Failproof probes |
| `POST` | `/api/research` | SSE research pipeline |
| `POST` | `/api/demo/compare` | Protected vs unprotected comparison |
| `GET` | `/api/reliability` | Run history + metrics |
| `GET` | `/api/reliability/:id?verify=1` | Cloud session verify |
| `POST` | `/api/files/extract` | PDF/text extract |

---

## Deployment (Vercel · QuoraAI only)

Project: `anushka-singh-rajputs-projects/quorai` → [https://quorai-ecru.vercel.app](https://quorai-ecru.vercel.app)

1. Set Production env vars from the table above (real values, not placeholders)
2. `ALLOW_MOCK_FALLBACK=0`
3. `FAILPROOFAI_ENVIRONMENT=production`
4. Deploy from the product branch:

```bash
vercel deploy --prod --scope anushka-singh-rajputs-projects
```

---

## License

MIT — see [LICENSE](./LICENSE).
