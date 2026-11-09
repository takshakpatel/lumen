# Product

<!-- impeccable:product-schema 1 -->

## Platform

Web application (Next.js 14 frontend + FastAPI Python backend).

## Stack

Python 3.11+, FastAPI, LangChain, Groq API (`qwen/qwen3.8-27b`), local sentence-transformers (`all-MiniLM-L6-v2` embeddings + `ms-marco` cross-encoder re-ranker), ChromaDB, BM25 (`rank-bm25`), PyMuPDF (`fitz` layout & table parser), Pillow, Matplotlib, SQLite, Next.js 14 (React 18, TypeScript, Tailwind CSS), Docker.

## Users

Researchers, engineers, analysts, and enterprise teams who need to query complex document sets (technical specifications, financial reports, research papers, charters) containing dense tables, architectural diagrams, and empirical charts, and receive grounded, cited answers with deep holistic comprehension rather than isolated snippet matching.

## Product Purpose

An Enterprise Cognitive RAG system that answers questions strictly from user-supplied documents with:
1. **Multimodal Visual Understanding**: Automatically transcribing and interpreting charts, graphs, and diagrams.
2. **Layout-Aware Structured Table Extraction**: Preserving complex tables in Markdown format.
3. **Whole-Document Executive Maps**: Synthesizing overall document purpose, governance, metrics, and outlines to answer holistic and comparative questions without losing the big picture.
4. **Context-Enriched Chunks (Contextual Retrieval)**: Preserving provenance and document context across every chunk.
5. **Grounded, Clutter-Free Delivery**: Clean answers without distracting bracketed inline citation tags (`[1]`), accompanied by interactive, expandable source evidence cards.

## Positioning

Unlike generic LLM wrappers or naive chunk-based RAG bots:
- Lumen **understands complex visual and tabular layouts** instead of treating documents like flat character streams.
- Lumen **avoids the "Chunk Isolation" trap** by maintaining an Executive Document Map for every uploaded file.
- Lumen **refuses to hallucinate** when context is insufficient, explicitly stating what is known vs. unknown.
- Lumen delivers an **enterprise-grade, accessible user experience** with non-blocking confirmation dialogs, optimistic UI, and dark/light theming.

## Core Capabilities

- **Multimodal Vision Ingestion**: Ingests PDFs, extracts high-resolution figures, and passes them to Groq Vision to transcribe axes, data points, trends, and takeaways.
- **Layout-Aware Table Parsing**: Uses PyMuPDF's table detection to convert complex tables into structured Markdown tables (`| Col 1 | Col 2 |`).
- **Executive Document Map Generation**: Automatically summarizes the purpose, key metrics, and structural outline of each uploaded document.
- **Contextual Retrieval Chunking**: Prepends `[Document: ... | Page: ... | Type: ...]` to each chunk to prevent orphan chunks.
- **Hybrid Search (BM25 + Dense Vectors + RRF)**: Combines exact keyword matching with deep semantic similarity.
- **Cross-Encoder Re-Ranking**: Scores top retrieval candidates with a cross-encoder model for optimal relevance.
- **Clean Answer Rendering**: Strips raw citation brackets from text while rendering interactive source cards in the UI.
- **In-App Confirmation Modal Dialog**: Accessible, non-blocking modal (`ConfirmModal`) with `Escape` dismissal and autofocus on cancel for destructive actions.
- **Optimistic UI with Hydration Guards**: Ref-tracked state prevents race conditions between client-side message sending and background server hydration.
- **Full Theme Parity**: Complete Dark and Light mode support with zero flash on reload.

## Product Principles

1. **Grounded In Evidence**: Every statement must stem from retrieved document context, tables, or visual figures.
2. **Never Fabricate**: When context is absent or ambiguous, acknowledge limitations rather than hallucinating plausible fiction.
3. **Understand the Whole**: Combine global document context with specific evidence so high-level synthesis questions receive comprehensive answers.
4. **Defensive & Accessible UX**: Prefer accessible, non-blocking dialogs and optimistic state updates over brittle native browser primitives.
5. **Radical Transparency**: Expose latency, tokens, cost, and exact source snippets for every answer.
