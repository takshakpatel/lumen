"use client";

import { useMemo, useState } from "react";
import { SourceChunk } from "@/types";

interface SourcePinsProps {
  sources: SourceChunk[];
}

interface Group {
  name: string;
  full: string;
  chunks: SourceChunk[];
  image?: boolean;
}

function cleanDocName(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

function groupSources(sources: SourceChunk[]): Group[] {
  const map = new Map<string, Group>();
  for (const s of sources) {
    const rawName = cleanDocName(s.source);
    // Group by normalized base document name (so .pdf and .docx or multiple uploads collapse into 1 group)
    const baseKey = rawName.replace(/\.[^/.]+$/, "").toLowerCase();

    if (!map.has(baseKey)) {
      map.set(baseKey, { name: rawName, full: s.source, chunks: [], image: s.type === "image" });
    }
    const g = map.get(baseKey)!;

    // Deduplicate identical text snippets within the same document group
    const snippetFingerprint = (s.snippet || "").replace(/\s+/g, " ").trim().slice(0, 100).toLowerCase();
    const isDuplicateSnippet = g.chunks.some((c) => {
      const existing = (c.snippet || "").replace(/\s+/g, " ").trim().slice(0, 100).toLowerCase();
      return existing === snippetFingerprint;
    });

    if (!isDuplicateSnippet) {
      g.chunks.push(s);
    }
    if (s.type === "image") g.image = true;
  }
  return Array.from(map.values());
}

export default function SourcePins({ sources }: SourcePinsProps) {
  const [open, setOpen] = useState<number | null>(null);
  const groups = useMemo(() => groupSources(sources), [sources]);

  if (!groups.length) return null;

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-ink-dim">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M1.5 2.5h9M1.5 6h9M1.5 9.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span>Sources ({groups.length} document{groups.length === 1 ? "" : "s"})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {groups.map((g, i) => {
          const active = open === i;
          return (
            <button
              key={g.name}
              onClick={() => setOpen(active ? null : i)}
              aria-expanded={active}
              aria-label={`Source ${i + 1}: ${g.name}`}
              className={`flex items-center gap-1.5 rounded-full border border-hairline bg-panel-subtle px-2.5 py-1 text-[11px] transition-all ${
                active ? "text-heading border-brand/50 bg-brand/10" : "text-ink-dim hover:text-heading hover:bg-item-hover"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-brand" : "bg-thermo/70"}`} />
              {g.image && (
                <span className="text-[9px] font-semibold uppercase text-thermo-dim" title="Image from document">IMG</span>
              )}
              <span className="digits font-medium tabular-nums">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <span className="max-w-[160px] truncate">{g.name}</span>
              {g.chunks.length > 1 && (
                <span className="digits rounded-full bg-brand/20 px-1.5 text-[9px] text-heading">
                  {g.chunks.length} chunks
                </span>
              )}
            </button>
          );
        })}
      </div>

      {open !== null && groups[open] && (
        <div className="pin-rise mt-2 rounded-xl border border-hairline bg-card-surface p-3 shadow-xs" key={open}>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="digits text-[10px] font-medium uppercase tracking-[0.12em] text-ink-dim">
              Source {open + 1} · {groups[open].name}
            </span>
            <span className="digits text-[10px] text-ink-faint">
              {groups[open].chunks.length} chunk{groups[open].chunks.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {groups[open].chunks.map((c, ci) => (
              <div key={ci} className="rounded-lg border border-hairline bg-panel-subtle p-2">
                {c.type === "image" ? (
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 rounded-md bg-thermo/10 px-2 py-0.5 text-[10px] font-medium text-thermo">
                      IMAGE — Page {c.page ?? "?"}
                    </span>
                    <span className="text-[13px] leading-relaxed text-ink">{c.snippet}</span>
                  </div>
                ) : (
                  <>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="digits text-[9px] uppercase tracking-[0.1em] text-ink-faint">
                        {c.page !== null && c.page !== undefined ? `Page ${c.page + 1}` : "Excerpt"}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-ink">{c.snippet}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
