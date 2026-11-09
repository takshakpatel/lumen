"use client";

import { useRef, useState } from "react";
import { uploadDocuments } from "@/lib/api";

const ACCEPTED = ".pdf,.docx,.html,.htm,.md,.txt,.pptx";

interface IngestPanelProps {
  onIngested: (info: string) => void;
  lastIngestedStatus?: string | null;
}

export default function IngestPanel({ onIngested, lastIngestedStatus }: IngestPanelProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | File[]) {
    setError(null);
    const next = Array.from(list);
    if (!next.length) return;
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => f.name + f.size));
      const fresh = next.filter((f) => !seen.has(f.name + f.size));
      return [...prev, ...fresh];
    });
  }

  async function handleUpload() {
    if (!files.length || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await uploadDocuments(files);
      const imgText = res.images_extracted ? ` · ${res.images_extracted} images extracted` : "";
      onIngested(
        `Uploaded ${res.documents_loaded} · carved ${res.chunks_created} chunks into ${res.collection_name}${imgText}`
      );
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
      setIsExpanded(false);
    } catch (e: any) {
      setError(e.message || "Upload ingestion failed");
    } finally {
      setLoading(false);
    }
  }

  if (!isExpanded) {
    return (
      <div className="flex items-center justify-between border-b border-hairline bg-panel px-4 py-2 transition-all sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              lastIngestedStatus ? "bg-verified animate-pulse" : "bg-thermo"
            }`}
          />
          <span className="truncate text-xs font-medium text-ink">
            {lastIngestedStatus || "Knowledge base ready · Click to add or update documents"}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="ml-3 flex shrink-0 items-center gap-1.5 rounded-lg border border-hairline bg-btn-subtle px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-btn-subtle-hover hover:text-heading"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Add documents
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-hairline bg-panel p-4 transition-all sm:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-thermo">
              <path
                d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Document Ingestion</span>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            aria-label="Collapse upload panel"
            title="Collapse upload panel"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-dim transition-colors hover:bg-btn-subtle-hover hover:text-heading"
          >
            <span>Collapse</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 10l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-stretch gap-3">
          {/* Dropzone / picker */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
            className={`flex min-h-24 flex-1 cursor-pointer items-center gap-3.5 rounded-xl border border-dashed px-4 py-3 transition-colors ${
              dragging
                ? "border-thermo bg-thermo/10"
                : "border-subtle bg-panel-subtle hover:border-hairline hover:bg-item-hover"
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0 text-thermo">
              <path
                d="M10 13V3M6.5 6.5 10 3l3.5 3.5M3 12v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="flex-1">
              <span className="block text-sm font-medium text-heading">Drop your documents here or click to browse</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-dim">
                Supports PDF, DOCX, PPTX, HTML, Markdown, and TXT
              </span>
            </span>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED}
              className="sr-only"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            {files.length > 0 && (
              <span className="digits hidden shrink-0 text-xs uppercase tracking-[0.12em] text-ink-faint lg:block">
                {files.length} file{files.length === 1 ? "" : "s"} selected
              </span>
            )}
          </label>

          {/* Upload action */}
          <button
            onClick={handleUpload}
            disabled={loading || !files.length}
            className="flex min-w-32 shrink-0 items-center justify-center rounded-xl bg-brand px-5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 shadow-xs"
          >
            {loading ? "Uploading…" : "Upload files"}
          </button>
        </div>

        {/* Selected files */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 rounded-lg border border-hairline bg-card-surface px-2.5 py-1 text-xs text-ink shadow-xs"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-thermo/70" />
                <span className="max-w-[180px] truncate">{f.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="text-ink-faint transition-colors hover:text-refusal"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-refusal/40 bg-refusal/10 px-3.5 py-2 text-xs text-refusal">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
