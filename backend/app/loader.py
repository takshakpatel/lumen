from __future__ import annotations

import os
from pathlib import Path

import pymupdf as fitz  # PyMuPDF
from langchain_community.document_loaders import (
    Docx2txtLoader,
    BSHTMLLoader,
    TextLoader,
)
from langchain_core.documents import Document

from app.image_extractor import extract_images_from_pdf


def _load_pdf_structured(path: Path) -> list[Document]:
    """Extract PDF pages with layout-aware text preservation and structured Markdown tables."""
    try:
        doc = fitz.open(str(path))
    except Exception as e:
        print(f"Warning: Failed to open PDF {path}: {e}")
        return []

    docs: list[Document] = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]

        # 1. Detect and extract structured tables
        table_mds: list[str] = []
        tab_rects: list[fitz.Rect] = []
        try:
            tabs = page.find_tables()
            for t in tabs:
                try:
                    md = t.to_markdown()
                    if md and len(md.strip()) > 8:
                        table_mds.append(md.strip())
                        tab_rects.append(fitz.Rect(t.bbox))
                except Exception:
                    pass
        except Exception:
            pass

        # 2. Extract text blocks, excluding text already captured in table bounding boxes
        blocks = page.get_text("blocks")
        text_paragraphs: list[str] = []
        for b in blocks:
            if b[6] != 0:  # text blocks only
                continue
            b_rect = fitz.Rect(b[:4])
            # Skip block if it is inside a detected table bounding box
            in_table = any(b_rect.intersects(tr) for tr in tab_rects)
            cleaned_text = b[4].strip()
            if not in_table and cleaned_text:
                text_paragraphs.append(cleaned_text)

        # 3. Assemble coherent page document
        content_sections = []
        if text_paragraphs:
            content_sections.append("\n\n".join(text_paragraphs))
        if table_mds:
            content_sections.append("### Structured Tables / Data:\n" + "\n\n".join(table_mds))

        page_content = "\n\n".join(content_sections).strip()
        if page_content:
            docs.append(
                Document(
                    page_content=page_content,
                    metadata={
                        "source": str(path),
                        "filename": path.name,
                        "page": page_idx + 1,
                        "has_tables": len(table_mds) > 0,
                        "table_count": len(table_mds),
                        "type": "text",
                    },
                )
            )

    doc.close()
    return docs


def _load_pptx(path: Path) -> list[Document]:
    """Load a PowerPoint file, extracting text from every slide."""
    try:
        from pptx import Presentation  # type: ignore
    except ImportError:
        print("Warning: python-pptx not installed. Run: pip install python-pptx")
        return []

    try:
        prs = Presentation(str(path))
        docs = []
        for slide_num, slide in enumerate(prs.slides, start=1):
            texts = []
            for shape in slide.shapes:
                if hasattr(shape, "text") and shape.text.strip():
                    texts.append(shape.text.strip())
            if texts:
                content = "\n".join(texts)
                docs.append(
                    Document(
                        page_content=content,
                        metadata={
                            "source": str(path),
                            "filename": path.name,
                            "slide": slide_num,
                            "page": slide_num,
                            "type": "presentation",
                        },
                    )
                )
        return docs
    except Exception as e:
        print(f"Warning: failed to load {path}: {e}")
        return []


SUPPORTED_EXTENSIONS = {
    ".pdf": _load_pdf_structured,
    ".docx": Docx2txtLoader,
    ".html": BSHTMLLoader,
    ".htm": BSHTMLLoader,
    ".md": TextLoader,
    ".txt": TextLoader,
    ".pptx": None,  # handled by _load_pptx
}


def load_documents(path: str | Path, extract_images: bool = True) -> list[Document]:
    """Load documents from a file or directory.

    Supported formats: PDF, DOCX, HTML, Markdown, TXT, PPTX.
    For PDFs, uses layout-aware extraction with table detection and Groq multimodal vision.
    """
    target = Path(path)
    docs: list[Document] = []

    if target.is_file():
        docs.extend(_load_file(target))
        if extract_images and target.suffix.lower() == ".pdf":
            docs.extend(extract_images_from_pdf(target))
    elif target.is_dir():
        for f in sorted(target.rglob("*")):
            if f.suffix.lower() in SUPPORTED_EXTENSIONS:
                docs.extend(_load_file(f))
                if extract_images and f.suffix.lower() == ".pdf":
                    docs.extend(extract_images_from_pdf(f))
    else:
        raise FileNotFoundError(f"Path does not exist: {target}")

    return docs


def load_uploaded_files(paths: list[str | Path], extract_images: bool = True) -> list[Document]:
    """Load documents from a list of individual uploaded files."""
    docs: list[Document] = []
    for raw in paths:
        p = Path(raw)
        if not p.is_file():
            print(f"Warning: skipped non-file: {p}")
            continue
        if p.suffix.lower() not in SUPPORTED_EXTENSIONS:
            print(f"Warning: unsupported file type, skipped: {p.name}")
            continue
        docs.extend(_load_file(p))
        if extract_images and p.suffix.lower() == ".pdf":
            docs.extend(extract_images_from_pdf(p))
    return docs


def _load_file(path: Path) -> list[Document]:
    ext = path.suffix.lower()

    if ext == ".pptx":
        return _load_pptx(path)

    if ext == ".pdf":
        return _load_pdf_structured(path)

    loader_cls = SUPPORTED_EXTENSIONS.get(ext)
    if loader_cls is None:
        return []

    try:
        loader = loader_cls(str(path))
        docs = loader.load()
        for doc in docs:
            doc.metadata.setdefault("source", str(path))
            doc.metadata.setdefault("filename", path.name)
            doc.metadata.setdefault("page", 1)
            doc.metadata.setdefault("type", "text")
        return docs
    except Exception as e:
        print(f"Warning: failed to load {path}: {e}")
        return []
