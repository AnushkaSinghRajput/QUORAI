# QUORAI product walkthrough

Live product: [https://quorai-ecru.vercel.app](https://quorai-ecru.vercel.app)  
Failproof workspace: [https://app.befailproof.ai/quoraai](https://app.befailproof.ai/quoraai)

## Operator checklist

1. Production has real `TAVILY_API_KEY`, `OPENAI_API_KEY`, `AUTH_SECRET`, and `FAILPROOFAI_API_KEY`
2. `ALLOW_MOCK_FALLBACK=0`
3. Failproof key includes `events:add`; Cloud verify also needs `events:read` (or `FAILPROOFAI_READ_API_KEY`)
4. `GET /api/health?failproof=1` reports `liveReady: true` and Failproof ingest healthy

## Guided tour

### 1. Live research

1. Open `/`
2. Run Deep Research, for example:  
   `Compare RAG architectures for production chatbots with citations.`
3. Review streaming stages, source cards, citation ledger, and follow-ups
4. Confirm the brief is not labeled Demo mode

### 2. Protected vs unprotected comparison

1. Open `/demo`
2. Run the same claim-heavy query in both modes
3. Compare policy decisions, evidence outcomes, and reliability records

### 3. Reliability console

1. Open `/reliability`
2. Review success / blocked / failure / recovery metrics
3. Expand a run for decisions, evidence, and delivery status
4. Use **Verify in Cloud** when `events:read` is available

### 4. Failproof observability

1. Open QuoraAI → Observe → Events
2. Filter environment `production`, agent `quorai-research`
3. Inspect `agent_start`, tool, model, and `agent_end` events for a session

## When model billing blocks synthesis

If Tavily search succeeds but OpenAI and Anthropic return billing or quota errors, QUORAI still finishes the run with an **extractive brief**:

- Findings are assembled only from retrieved source snippets (and document evidence when attached)
- The brief is labeled **Extractive brief** — it is not mock search and not model narrative
- The workspace badge shows `extractive` instead of a live LLM provider
- Add credits on OpenAI or Anthropic, then retry for full model synthesis and follow-ups

## Integrity rule

Search and synthesis use live providers when keys are configured. Mock providers only run when explicitly enabled and are labeled — never presented as live research. Extractive briefs are an honest degradation path when live search works but model APIs are billing-blocked.
