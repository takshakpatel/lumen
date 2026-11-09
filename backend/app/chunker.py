from __future__ import annotations

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_documents(
    documents: list[Document],
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> list[Document]:
    """Split documents into context-enriched overlapping chunks.

    Special chunk types:
    - Image chunks (`type == "image"`) are preserved as atomic visual units.
    - Summary chunks (`type == "document_summary"`) are preserved intact.
    - Text chunks receive contextual breadcrumbs (`[Document: ... | Page: ...]`)
      to eliminate orphan-chunk ambiguity and enhance BM25/Vector retrieval.
    """
    text_docs = [
        d for d in documents
        if d.metadata.get("type") not in ("image", "document_summary")
    ]
    passthrough_docs = [
        d for d in documents
        if d.metadata.get("type") in ("image", "document_summary")
    ]

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        add_start_index=True,
    )
    raw_chunks = splitter.split_documents(text_docs)

    enriched_chunks: list[Document] = []
    for i, chunk in enumerate(raw_chunks):
        chunk.metadata["chunk_index"] = i
        filename = chunk.metadata.get("filename", "Document")
        page = chunk.metadata.get("page", 1)
        has_tables = chunk.metadata.get("has_tables", False)

        tag = "Structured Table" if has_tables else "Text"
        context_header = f"[Document: {filename} | Page: {page} | {tag}]\n"
        
        # Prepend contextual coordinate if not already present
        if not chunk.page_content.startswith("[Document:"):
            chunk.page_content = f"{context_header}{chunk.page_content}"

        enriched_chunks.append(chunk)

    # Append image and summary chunks intact
    for doc in passthrough_docs:
        doc.metadata["chunk_index"] = len(enriched_chunks)
        enriched_chunks.append(doc)

    return enriched_chunks
