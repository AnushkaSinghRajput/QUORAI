#!/usr/bin/env python3
"""Generate Team Phoenix product brief PDF (3–4 pages)."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parents[1] / "docs" / "Team_Phoenix_QUORAI_Brief.pdf"
GITHUB = "https://github.com/AnushkaSinghRajput/QUORAI"
VERCEL = "https://quorai-ecru.vercel.app"
FAILPROOF = "https://app.befailproof.ai/quoraai"

NAVY = colors.HexColor("#0B1220")
ACCENT = colors.HexColor("#5B6CFF")
SOFT = colors.HexColor("#F4F6FB")
MUTED = colors.HexColor("#4B5568")
LINE = colors.HexColor("#D7DCE8")


def styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=34,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=16,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=NAVY,
            spaceBefore=10,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=ACCENT,
            spaceBefore=8,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=NAVY,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=NAVY,
        ),
        "meta": ParagraphStyle(
            "meta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
    }


def bullets(items, style):
    return ListFlowable(
        [ListItem(Paragraph(item, style), leftIndent=8, bulletColor=ACCENT) for item in items],
        bulletType="bullet",
        start="•",
        leftIndent=12,
        bulletFontSize=9,
    )


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 14 * mm, A4[0] - 18 * mm, 14 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 8 * mm, "Team Phoenix · QUORAI 2.0")
    canvas.drawRightString(A4[0] - 18 * mm, 8 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build():
    s = styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title="QUORAI 2.0 — Team Phoenix Product Brief",
        author="Team Phoenix",
    )
    story = []

    # ---- Page 1: Cover + problem ----
    story.append(Spacer(1, 18 * mm))
    story.append(Paragraph("QUORAI 2.0", s["cover_title"]))
    story.append(
        Paragraph(
            "AI-Powered Web Research with Verifiable Agent Reliability",
            s["cover_sub"],
        )
    )
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("<b>Team Phoenix</b>", s["cover_sub"]))
    story.append(Paragraph("1) Anushka Singh Rajput &nbsp;&nbsp; 2) Vedant Gupta", s["cover_sub"]))
    story.append(Spacer(1, 8 * mm))

    links = [
        ["GitHub", GITHUB],
        ["Live app (Vercel)", VERCEL],
        ["Failproof workspace", FAILPROOF],
    ]
    table = Table(links, colWidths=[1.6 * inch, 4.6 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(table)
    story.append(Spacer(1, 10 * mm))

    story.append(Paragraph("1. The real-world problem", s["h1"]))
    story.append(
        Paragraph(
            "Teams, researchers, and operators increasingly ask AI systems to answer high-stakes "
            "questions from the open web. Generic chatbots often invent sources, mix outdated "
            "facts, or fail silently when a tool call loops. The result is fragile decision-making: "
            "briefs that look polished but cannot be audited, defended, or reproduced.",
            s["body"],
        )
    )
    story.append(
        Paragraph(
            "QUORAI attacks that gap. It turns a natural-language question into a multi-source, "
            "citation-backed research brief while recording genuine agent execution traces for "
            "reliability review — so every answer can be inspected, not just trusted.",
            s["body"],
        )
    )

    story.append(Paragraph("2. What we are building", s["h1"]))
    story.append(
        bullets(
            [
                "<b>Live retrieval</b> — Tavily as primary search (Serper optional fallback).",
                "<b>Live synthesis</b> — OpenAI as primary LLM (Anthropic optional fallback).",
                "<b>Cited briefs</b> — ranked sources, citation confidence, PDF/text grounding.",
                "<b>Failproof reliability</b> — runtime events shipped to the QuoraAI workspace.",
                "<b>Protected vs unprotected demo</b> — genuine policy contrast for stakeholders.",
                "<b>Operator console</b> — /reliability metrics, decisions, Cloud verify.",
            ],
            s["bullet"],
        )
    )

    story.append(PageBreak())

    # ---- Page 2: Solution path ----
    story.append(Paragraph("3. End-to-end solution (step by step)", s["h1"]))
    story.append(Paragraph("Step A — Capture the question", s["h2"]))
    story.append(
        Paragraph(
            "A user enters a Quick Search or Deep Research query (optionally with PDF/notes). "
            "The client opens a research session and streams progress over SSE from "
            "<font face='Courier'>POST /api/research</font>.",
            s["body"],
        )
    )
    story.append(Paragraph("Step B — Retrieve evidence", s["h2"]))
    story.append(
        Paragraph(
            "QUORAI queries the live web through Tavily, ranks domains, and merges uploaded "
            "document evidence. Tool calls are allowlisted and rate-limited inside the Failproof "
            "trace layer to stop loops and runaway execution.",
            s["body"],
        )
    )
    story.append(Paragraph("Step C — Synthesize with citations", s["h2"]))
    story.append(
        Paragraph(
            "OpenAI streams a structured brief grounded in retrieved sources. Citation markers "
            "[n] are verified against the source set. Unsupported URLs and uncited claim lines "
            "are flagged; protected mode can deny weak evidence.",
            s["body"],
        )
    )
    story.append(Paragraph("Step D — Observe and recover", s["h2"]))
    story.append(
        Paragraph(
            "Every run emits agent/tool/model events via the official Failproof SDK, then ships "
            "NDJSON batches to <font face='Courier'>POST /v1/events</font> for the QuoraAI "
            "workspace. Local reliability records capture decisions, failures, recoveries, and "
            "delivery status for the /reliability console.",
            s["body"],
        )
    )
    story.append(Paragraph("Step E — Compare and decide", s["h2"]))
    story.append(
        Paragraph(
            "The /demo flow runs the same query under protected and unprotected policies so "
            "stakeholders can see how reliability controls change outcomes using genuine execution "
            "data — not screenshots of mocked traces.",
            s["body"],
        )
    )

    story.append(Paragraph("4. Architecture at a glance", s["h1"]))
    arch = [
        ["Layer", "Primary", "Fallback / notes"],
        ["Search", "Tavily", "Serper (optional)"],
        ["LLM", "OpenAI", "Anthropic (optional)"],
        ["Reliability", "Failproof Cloud (quoraai)", "Local reliability store"],
        ["Hosting", "Vercel Production", "Next.js App Router + SSE"],
        ["Auth", "httpOnly sessions", "Requires real AUTH_SECRET"],
    ]
    at = Table(arch, colWidths=[1.4 * inch, 2.2 * inch, 2.6 * inch])
    at.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 1), (-1, -1), SOFT),
                ("TEXTCOLOR", (0, 1), (-1, -1), NAVY),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(at)

    story.append(PageBreak())

    # ---- Page 3: Quality attributes ----
    story.append(Paragraph("5. How we deliver quality in production", s["h1"]))
    story.append(Paragraph("Reliability", s["h2"]))
    story.append(
        bullets(
            [
                "No silent mock-as-live: missing Tavily/OpenAI keys return clear API errors when "
                "<font face='Courier'>ALLOW_MOCK_FALLBACK=0</font>.",
                "Loop detection, tool allowlists, execution limits, evidence and citation checks.",
                "Failproof traces for every research session shipped to QuoraAI Cloud.",
            ],
            s["bullet"],
        )
    )
    story.append(Paragraph("Scalability", s["h2"]))
    story.append(
        bullets(
            [
                "Stateless Next.js API routes on Vercel with streaming responses.",
                "Provider chain pattern: primary + optional fallbacks without rewriting the UI.",
                "Rate limiting on research, demo, auth, and upload endpoints.",
            ],
            s["bullet"],
        )
    )
    story.append(Paragraph("Maintainability", s["h2"]))
    story.append(
        bullets(
            [
                "Clear module boundaries: providers/, research/, failproof/, auth/.",
                "Shared list/research patterns, Zod validation, TypeScript throughout.",
                "Documented env template, product walkthrough, and verification scripts.",
            ],
            s["bullet"],
        )
    )
    story.append(Paragraph("Security & honesty", s["h2"]))
    story.append(
        bullets(
            [
                "Server-side API keys only; secrets never committed.",
                "Session cookies require a real AUTH_SECRET (no hardcoded fallback).",
                "Credential presence diagnostics expose status without printing values.",
            ],
            s["bullet"],
        )
    )

    story.append(Paragraph("6. Stakeholder demo path", s["h1"]))
    story.append(
        bullets(
            [
                f"Open live app: {VERCEL}",
                "Run a Deep Research query and show streaming stages + citations.",
                "Open /demo for protected vs unprotected comparison.",
                "Open /reliability and verify a session; then inspect QuoraAI Observe → Events.",
                f"Repository: {GITHUB}",
            ],
            s["bullet"],
        )
    )

    story.append(PageBreak())

    # ---- Page 4: Team + outcomes ----
    story.append(Paragraph("7. Team Phoenix", s["h1"]))
    team = [
        ["Member", "Role focus"],
        [
            "Anushka Singh Rajput",
            "Product engineering, Vercel production, Failproof QuoraAI integration, research UX",
        ],
        [
            "Vedant Gupta",
            "Reliability storytelling, product narrative, solution framing for real-world buyers",
        ],
    ]
    tt = Table(team, colWidths=[2.0 * inch, 4.2 * inch])
    tt.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 1), (-1, -1), SOFT),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    story.append(tt)
    story.append(Spacer(1, 6 * mm))

    story.append(Paragraph("8. Expected outcomes", s["h1"]))
    story.append(
        Paragraph(
            "QUORAI 2.0 demonstrates that AI research systems can be both useful and accountable. "
            "A decision-maker gets a cited brief in minutes; an operator gets a forensic trail of "
            "what the agent searched, synthesized, blocked, and recovered. That combination — "
            "speed with auditability — is how AI research becomes production infrastructure "
            "rather than a demo chat window.",
            s["body"],
        )
    )

    story.append(Paragraph("9. Links (bookmark these)", s["h1"]))
    story.append(
        bullets(
            [
                f"<b>GitHub:</b> {GITHUB}",
                f"<b>Vercel production:</b> {VERCEL}",
                f"<b>Failproof QuoraAI:</b> {FAILPROOF}",
            ],
            s["bullet"],
        )
    )
    story.append(Spacer(1, 12 * mm))
    story.append(Paragraph("Built with integrity — no fabricated live research claims.", s["meta"]))
    story.append(Paragraph("Team Phoenix · 2026", s["meta"]))

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
