export const PRODUCT_FEATURES = [
  {
    id: "console",
    title: "Research console",
    body: "Ask once. QUORAI retrieves the live web, scores sources, and streams a cited brief.",
    href: "/#console",
  },
  {
    id: "deep",
    title: "Deep Research",
    body: "Wider retrieval and denser synthesis when the decision cannot rest on a single snippet.",
    href: "/solutions#strategic",
  },
  {
    id: "upload",
    title: "Ground in your files",
    body: "Attach notes, CSVs, or briefs. The pipeline treats them as primary evidence and checks the web.",
    href: "/#console",
  },
  {
    id: "models",
    title: "Bring your LLM",
    body: "OpenAI, Anthropic, or demo mock — retrieval first, then streamed synthesis.",
    href: "/models",
  },
  {
    id: "api",
    title: "Product API",
    body: "The same routes the UI uses: research SSE, briefs, waitlist, auth.",
    href: "/developers",
  },
] as const;

export const COMPANY = {
  name: "QUORAI",
  headline: "AI-powered web research for consequential work.",
  mission:
    "QUORAI exists so analysts, operators, and leaders can ask a hard question and receive a cited brief — not a chatbot improvisation.",
  points: [
    {
      title: "Grounded",
      body: "Every answer starts with retrieval. Models compose; they do not invent the web.",
    },
    {
      title: "Cited",
      body: "Sources carry relevance and credibility so you can audit the path, not just the paragraph.",
    },
    {
      title: "Ready to ship",
      body: "Demo with no keys. Production with Tavily or Serper plus OpenAI or Anthropic.",
    },
  ],
} as const;

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  minutes: number;
  tags: string[];
  body: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "retrieval-before-rhetoric",
    title: "Retrieval before rhetoric",
    excerpt:
      "Why QUORAI never answers from model memory alone — and what that changes for diligence.",
    date: "2026-08-12",
    minutes: 4,
    tags: ["Research", "Architecture"],
    body: [
      "Large language models are fluent. Fluency is not evidence. QUORAI is built so a query hits the open web first, sources are scored, and only then does an LLM compose the brief.",
      "That order matters. A model that speaks first will fill gaps with plausible language. A pipeline that retrieves first can cite, contradict, and leave uncertainty on the page.",
      "Deep Research widens the net. Quick Search keeps the loop short. Both end in the same contract: a cited answer you can hand to someone who was not in the room.",
    ],
  },
  {
    slug: "one-query-many-paths",
    title: "One query. Many paths.",
    excerpt:
      "How branching retrieval turns a single question into foundational, operational, and strategic briefs.",
    date: "2026-08-04",
    minutes: 3,
    tags: ["Product"],
    body: [
      "A good research system does not pretend every question is the same size. Explain a term. Compare two vendors. Stress-test a market claim. Those are different paths from the same console.",
      "QUORAI encodes that as Foundational, Operational, and Strategic tracks. Each card launches a live run with the right depth — Quick Search or Deep Research — and the same citation layer.",
      "The diagram on the home page is not decoration. It is the product: start with one node, branch, and land on a brief you can defend.",
    ],
  },
  {
    slug: "keys-when-you-need-them",
    title: "Keys when you need them",
    excerpt:
      "Demo mode is the full product. Live search and LLM keys are a configuration change, not a rewrite.",
    date: "2026-07-22",
    minutes: 3,
    tags: ["Engineering"],
    body: [
      "QUORAI ships with mock search and mock synthesis so the console, citations, follow-ups, and accounts work on day one.",
      "Set TAVILY_API_KEY or SERPER_API_KEY and OPENAI_API_KEY or ANTHROPIC_API_KEY. SEARCH_PROVIDER and LLM_PROVIDER stay on auto unless you pin them.",
      "If a live provider fails, the pipeline falls back to mock rather than failing the brief. That is deliberate: the product should remain usable while keys rotate.",
    ],
  },
];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-quorai",
    question: "What is QUORAI?",
    answer:
      "QUORAI is an AI-powered web research platform. It retrieves multiple sources, scores them, and streams a cited brief — from a simple explanation to a diligence-grade memo.",
  },
  {
    id: "demo-keys",
    question: "Do I need API keys to try it?",
    answer:
      "No. Demo mode runs the full pipeline with mock search and mock synthesis. Add Tavily/Serper and OpenAI/Anthropic keys when you want live retrieval and live models.",
  },
  {
    id: "deep-vs-quick",
    question: "What is the difference between Quick Search and Deep Research?",
    answer:
      "Quick Search uses a smaller source set for orientation. Deep Research retrieves more sources and asks the model for a denser, structured brief. Both cite the web.",
  },
  {
    id: "uploads",
    question: "Can I upload my own files?",
    answer:
      "Yes. The console accepts text files (.txt, .md, .csv, .json, .html). QUORAI treats them as primary evidence and still checks the live web.",
  },
  {
    id: "beta",
    question: "How do I join the beta?",
    answer:
      "Create an account on Join beta, or add your work email to the waitlist. Sessions stay on this workstation unless you sign in.",
  },
  {
    id: "api",
    question: "Is there an API?",
    answer:
      "Yes. The UI uses the same routes: POST /api/research (SSE), GET /api/briefs/:id, waitlist, contact, and auth. See /developers.",
  },
  {
    id: "deploy",
    question: "Where should I deploy QUORAI?",
    answer:
      "Vercel is the default for Next.js App Router and streaming. Set AUTH_SECRET in production. Optional: QUORAI_API_KEY and CONTACT_WEBHOOK_URL.",
  },
];

export function getPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug) ?? null;
}

export function getFaq(id: string) {
  return FAQ_ITEMS.find((item) => item.id === id) ?? null;
}
