from __future__ import annotations

from langchain_chroma import Chroma
from langchain_core.documents import Document

from app.vectorstore import get_vectorstore


def dedupe_documents(docs: list[Document]) -> list[Document]:
    """Strip duplicate chunks caused by re-ingesting the same file or identical content.

    Keeps the first (highest-ranked) occurrence of each logical chunk. Uses a normalized
    content fingerprint so identical text across different temporary upload folders
    or formats (.pdf vs .docx) collapses to a single entry.
    """
    import re
    seen_content: set[str] = set()
    result: list[Document] = []
    for doc in docs:
        raw = doc.page_content.strip()
        fingerprint = re.sub(r"\s+", " ", raw)[:150].lower()
        if not fingerprint or fingerprint in seen_content:
            continue
        seen_content.add(fingerprint)
        result.append(doc)
    return result


def naive_retrieve(
    query: str,
    k: int = 5,
    persist_dir: str | None = None,
    collection_name: str = "documents",
) -> list[Document]:
    """Retrieve the top-k text chunks by vector similarity (excludes image documents)."""
    store = get_vectorstore(persist_dir, collection_name)
    results = store.similarity_search(
        query,
        k=k,
        filter={"type": {"$ne": "image"}},
    )
    return dedupe_documents(results)
