<div align="center">

# ✦ Lumen

**An Enterprise Cognitive RAG System that understands documents holistically — with layout-aware structured table parsing, multimodal AI vision for charts and graphs, executive document topic maps, contextual retrieval, hybrid BM25 + dense vector search, cross-encoder re-ranking, and a unified modern UI.**

Local **embeddings + cross-encoder re-ranking** on your machine, generation & multimodal vision via the **Groq API** (`qwen/qwen3.8-27b`) — fast, high-accuracy, and no local GPU required.

</div>

---

## ⚡ Highlights

- **Multimodal AI Vision for Charts & Graphs** — extracts embedded charts, line plots, and architecture diagrams, passing high-resolution renders to Groq's multimodal vision model (`qwen/qwen3.8-27b`) to transcribe axes, data series, values, and trends directly into searchable semantic chunks.
- **Layout-Aware PDF & Markdown Table Parsing** — powered by PyMuPDF's `find_tables()` engine. Tables are converted into clean, structured Markdown tables (`| Col 1 | Col 2 |`), preserving row/column relationships that traditional flat parsers destroy.
- **Executive Document Understanding & Topic Maps** — solves the classic *"Chunk Isolation / Lost in the Middle"* problem. During ingestion, an Executive Document Map is generated to synthesize overall purpose, critical metrics, and section structure, enabling holistic questions (*"What is this document about?"*, *"Summarize the project risks and budget"*) to be answered cohesively.
- **Context-Enriched Chunks (Contextual Retrieval)** — every chunk is prepended with contextual provenance breadcrumbs (`[Document: ... | Page: ... | Type: ...]`), eliminating orphan-chunk ambiguity and drastically boosting BM25 and vector search precision.
- **Grounded, Cited Answers Without Clutter** — responses are clean, fluent, and direct. Inline bracketed tags like `[1][2]` are automatically stripped from text, while interactive expandable source cards and badges remain visible in the UI.
- **Hybrid Retrieval & Cross-Encoder Re-Ranking** — BM25 keyword search + dense vector search fused with **Reciprocal Rank Fusion (RRF)**, then precision-re-ranked by a local cross-encoder (`ms-marco-MiniLM-L-6-v2`).
- **Query Rewriting** — the LLM automatically generates alternative semantic phrasings of each query to overcome keyword mismatch before retrieval.
- **Multi-Turn Chat with Conversational Memory** — conversations are persisted to SQLite; ambiguous follow-ups (*"what about its budget?"*) are dynamically resolved against prior turns.
- **Custom Accessible In-App Modal Dialogs** — non-blocking, accessible confirmation modals (`ConfirmModal.tsx`) with keyboard navigation (`Escape` dismissal, safe auto-focus on Cancel) replace dated browser `window.confirm` popups.
- **Unified Modern UI & Light/Dark Theming** — edge-to-edge dark/light theme toggle, left-anchored animated thinking state (`LoadingState.tsx`) with live elapsed timer, and responsive sidebar navigation.
- **Observability** — query caching plus token usage and cost tracking exposed via `/stats`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11+, FastAPI, Uvicorn |
| **Orchestration** | LangChain (`langchain`, `langchain-groq`, `langchain-chroma`, `langchain-text-splitters`) |
| **LLM & Vision** | Groq API via `ChatGroq` (`qwen/qwen3.8-27b` for text synthesis and multimodal vision) |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` (local) |
| **Re-ranker** | `cross-encoder/ms-marco-MiniLM-L-6-v2` (local) |
| **Vector Store** | ChromaDB (persistent, `langchain-chroma`) |
| **Keyword Search** | BM25 (`rank-bm25` via `BM25Retriever`) |
| **History Store** | SQLite (`lumen_history.db`) |
| **Document & Table Parsing** | PyMuPDF (`fitz` layout & table engine), python-docx, python-pptx, BeautifulSoup4, Pillow |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **Deployment** | Docker / Docker Compose |

---

## 🏛️ Architecture

```
┌─────────────────────────────────┐        ┌─────────────────────────────────────────────────────────────┐
│          Next.js UI             │        │                       FastAPI Backend                       │
│        localhost:3000           │        │                       localhost:8000                        │
│                                 │  /api  │                                                             │
│  • Edge-to-edge Unified Theme   │ ─────▶ │  ┌───────────────────────────────────────────────────────┐  │
│  • Dark / Light Mode            │ ◀───── │  │ Ingestion Pipeline                                    │  │
│  • Left-anchored Loading State  │  JSON  │  │  • PyMuPDF Layout & Table Extraction (to Markdown)    │  │
│  • Custom In-App Confirm Modal  │        │  │  • Groq Vision AI (Transcribes Charts & Figures)      │  │
│  • De-duplicated Source Cards   │        │  │  • Executive Document Map Generator                   │  │
│  • Optimistic UI with Ref Guard │        │  │  • Contextual Retrieval Chunking (Breadcrumbs)        │  │
└─────────────────────────────────┘        │  └──────────────────────────┬────────────────────────────┘  │
                                           │                             │                               │
                                           │               ┌─────────────▼──────────────┐                │
                                           │               │     ChromaDB + BM25        │                │
                                           │               │   Dense & Sparse Index     │                │
                                           │               └─────────────┬──────────────┘                │
                                           │                             │                               │
                                           │  ┌──────────────────────────▼────────────────────────────┐  │
                                           │  │ Hybrid Retrieval & Cross-Encoder Re-Ranking           │  │
                                           │  │  • Query Rewriting (3 semantic variants)              │  │
                                           │  │  • BM25 + Vector Search (RRF Fusion)                  │  │
                                           │  │  • Cross-Encoder Re-Ranking (ms-marco-MiniLM)         │  │
                                           │  └──────────────────────────┬────────────────────────────┘  │
                                           │                             │                               │
                                           │  ┌──────────────────────────▼────────────────────────────┐  │
                                           │  │ Dual-Level Cognitive LLM Synthesis                    │  │
                                           │  │  • Tier 1: Global Document Executive Overview         │  │
                                           │  │  • Tier 2: Specific Tables, Text & Visual Figures     │  │
                                           │  │  • Cleaned Citations + Refusal Guardrails             │  │
                                           │  └───────────────────────────────────────────────────────┘  │
                                           └─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- A **Groq API key** — get one at [console.groq.com](https://console.groq.com/keys)

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Set GROQ_API_KEY in .env

uvicorn app.main:app --reload
```

The API will be live at `http://localhost:8000`. Verify with `curl http://localhost:8000/health`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**. The UI proxy automatically forwards `/api` requests to `localhost:8000`.

### 3. Docker (Alternative)

```bash
docker compose up --build
```

---

## 📊 Testing with Complex Multimodal Documents

We provide a comprehensive, multi-page test PDF in the repository:  
[`sample_documents/Project_Apex_Autonomous_Logistics.pdf`](sample_documents/Project_Apex_Autonomous_Logistics.pdf)

This test document features:
- **Architecture Flowcharts (Figure 1)**: Tests visual workflow and system component understanding.
- **Quarterly Capex/Opex Stacked Bar Charts (Figure 2)**: Tests visual number extraction, axes, and budget peaking analysis.
- **Dual-Axis Telemetry Line Plots (Figure 3)**: Tests empirical curve analysis (Payload weight vs Flight Range vs Power draw).
- **Structured Financial & Risk Tables (Tables 1, 2, 3)**: Tests multi-column Markdown table extraction.

### Sample Prompts to Try:
- *"What is Project Apex, who are the key stakeholders, and what is the primary objective?"* (Holistic test)
- *"According to the chart in Figure 2, what is the quarterly expenditure trend and in which quarter does it peak?"* (Vision test)
- *"What does the telemetry graph in Figure 3 indicate about range and power consumption as payload increases from 1kg to 10kg?"* (Dual-axis vision test)
- *"What is the allocated budget for Autonomous AI Navigation and who is the lead in Table 2?"* (Table test)

---

## ⚙️ Configuration (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | — | **Required.** Your Groq API key |
| `LLM_MODEL` | `qwen/qwen3.8-27b` | Chat model served by the Groq API |
| `VISION_MODEL` | `qwen/qwen3.8-27b` | Multimodal model for chart and image interpretation |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Local embedding model |
| `RERANKER_MODEL` | `cross-encoder/ms-marco-MiniLM-L-6-v2` | Local re-ranking cross-encoder |
| `CHROMA_PERSIST_DIR` | `./chroma_db` | Chroma persistence directory |
| `CHUNK_SIZE` | `1000` | Default chunk size |
| `CHUNK_OVERLAP` | `200` | Default chunk overlap |

---

## 📡 API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/ingest` | Ingest all documents from a server-side path |
| `POST` | `/ingest/upload` | Upload and ingest one or more files (with table & vision parsing) |
| `POST` | `/query` | Dual-level RAG query (hybrid retrieval + vision + re-ranking) |
| `POST` | `/query/hybrid` | Explicit hybrid retrieval query |
| `GET` | `/stats` | Cache statistics and cumulative token usage |
| `GET` | `/sessions` | List all chat sessions |
| `POST` | `/sessions` | Create a new chat session |
| `GET` | `/sessions/{id}` | Fetch conversation session history |
| `PATCH` | `/sessions/{id}` | Rename a chat session |
| `DELETE` | `/sessions/{id}` | Delete a chat session |
| `DELETE` | `/collection/{name}`| Clear a document collection |

---

## 🔒 Reliability & Defensive Engineering

- **Optimistic UI with Ref-based Hydration Guards**: Ephemeral ref tokens prevent asynchronous server hydration from wiping in-flight user messages.
- **Defensive Confirmation Dialogs**: Custom, accessible modal with keyboard listeners (`Escape`), click-outside detection, and safe default focus prevents accidental chat deletion.
- **Fingerprint-based Citation Deduplication**: Duplicate chunks across document pages are deduplicated using normalized content hashing so the user interface remains clean and informative.
- **Retry with Exponential Backoff**: Transient LLM or network failures trigger automatic retries with progressive backoff.

---

## 📄 License

MIT
