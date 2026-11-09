"""Executive Document Summarizer & Global Context Generator.

Constructs a holistic Executive Document Map for each ingested document,
enabling the RAG pipeline to answer high-level, synthesis, and thematic queries
without losing the big picture (solving the 'Lost in the Middle' / chunk isolation issue).
"""

from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_ENV_PATH, override=True)

from langchain_core.documents import Document
from langchain_groq import ChatGroq


def _get_summary_llm() -> ChatGroq:
    model_name = os.getenv("LLM_MODEL", "qwen/qwen3.8-27b")
    return ChatGroq(
        model=model_name,
        temperature=0.1,
        max_tokens=1024,
        api_key=os.getenv("GROQ_API_KEY"),
    )


def generate_document_overview(docs: list[Document], filename: str) -> Document | None:
    """Generate a holistic Executive Document Overview chunk for the document."""
    if not docs:
        return None

    # Collect up to 12,000 chars of representative content across pages
    parts = []
    total_len = 0
    for d in docs:
        if d.metadata.get("type") == "image":
            # Include image/figure descriptions if present
            parts.append(d.page_content)
        else:
            parts.append(d.page_content)
        total_len += len(d.page_content)
        if total_len > 14000:
            break

    content_sample = "\n\n---\n\n".join(parts)
    if len(content_sample.strip()) < 40:
        return None

    prompt = (
        "You are an expert document understanding intelligence system.\n"
        f"Analyze the provided document contents from '{filename}' and construct a comprehensive Executive Document Understanding Map.\n\n"
        "Provide a structured, deep breakdown with these exact sections:\n"
        "1. OVERALL PURPOSE & CONTEXT: What is this document, what organization/initiative does it concern, and what is its goal?\n"
        "2. KEY FACTS, METRICS & GOVERNANCE: Approved budgets, timelines, responsible personnel, operational protocols, and targets.\n"
        "3. STRUCTURAL BREAKDOWN: Key sections, topics, tables, and themes covered across the document.\n"
        "4. EXECUTIVE SYNTHESIS: A holistic narrative summarizing what this document establishes.\n\n"
        f"Document Content ({filename}):\n"
        f"{content_sample[:12000]}"
    )

    try:
        llm = _get_summary_llm()
        res = llm.invoke(prompt)
        summary_text = res.content if hasattr(res, "content") else str(res)

        source = docs[0].metadata.get("source", filename)
        return Document(
            page_content=f"[EXECUTIVE DOCUMENT OVERVIEW & TOPIC MAP — {filename}]\n\n{summary_text.strip()}",
            metadata={
                "source": str(source),
                "filename": filename,
                "type": "document_summary",
                "is_summary": True,
                "page": 1,
            },
        )
    except Exception as e:
        print(f"Warning: Failed to generate executive document overview for {filename}: {e}")
        return None
