# QUORAI 2.0 — Competition demo guide

Live site: [https://quorai-ecru.vercel.app](https://quorai-ecru.vercel.app)  
Failproof workspace: [https://app.befailproof.ai/quoraai](https://app.befailproof.ai/quoraai)

## Pre-flight (operators)

1. Vercel Production has **real** `TAVILY_API_KEY`, `OPENAI_API_KEY`, `AUTH_SECRET`, `FAILPROOFAI_API_KEY`
2. `ALLOW_MOCK_FALLBACK=0`
3. Failproof key has `events:add`; for Verify UI also `events:read` (or set `FAILPROOFAI_READ_API_KEY`)
4. `GET /api/health?failproof=1` shows `liveReady: true` and `failproof.capabilities.eventsAdd: true`

## Judge walkthrough (8–10 min)

### 1. Live research (2 min)

1. Open `/`
2. Run a Deep Research query, e.g.  
   `Compare RAG architectures for production chatbots with citations.`
3. Show streaming stages, source cards, citation ledger, follow-ups
4. Confirm the brief is **not** labeled Demo mode

### 2. Protected vs unprotected (3 min)

1. Open `/demo`
2. Run the comparison with a claim-heavy query
3. Contrast decisions: protected softens vs denies loops / weak evidence; unprotected records would-have-blocked outcomes
4. Open the linked reliability records for both session IDs

### 3. Reliability console (2 min)

1. Open `/reliability`
2. Show metrics (success / blocked / failures / recoveries)
3. Expand a run: decisions, evidence, delivery (`accepted` > 0)
4. Click **Verify in Cloud** (needs `events:read`)

### 4. Failproof dashboard (2 min)

1. Open [quoraai Observe → Events](https://app.befailproof.ai/quoraai)
2. Filter environment `production`, agent `quorai-research`
3. Open the session ID from the reliability card
4. Point out `agent_start` / `tool_use` / `model_*` / `agent_end` (and policy hooks)

## What “genuine” means here

- Search hits come from Tavily (or Serper fallback), not fixtures
- Synthesis comes from OpenAI (or Anthropic fallback)
- Failproof events are produced by `@failproofai/sdk` and uploaded via documented `POST /v1/events`
- If keys are missing, the API **errors clearly** — it does not invent a live brief

## Optional PDF evidence

Upload a short PDF/text note on the research console; document evidence is ranked alongside web sources.
