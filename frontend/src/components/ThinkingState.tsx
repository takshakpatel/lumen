"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/* ─────────────────────────────────────────────────────────
 * THINKING STATE — expandable agent retrieval & reasoning trace
 *
 *   Steps      RAG retrieval pipeline with spinner → checks
 *   Reasoning  Grounded synthesis reasoning
 *   Search     Document chunk inspection trace
 *   Coding     Tool / eval execution trace
 * ───────────────────────────────────────────────────────── */

const STAGES = [600, 900, 1400, 1600, 1000];

function useSequence(steps: number[]) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (stage >= steps.length - 1) return;
    const t = setTimeout(() => setStage((s) => s + 1), steps[stage]);
    return () => clearTimeout(t);
  }, [stage, steps]);
  return stage;
}

// Next.js SSR-safe layout effect to prevent hydration warnings on the server
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type TraceRow = {
  primary: string;
  secondary?: string;
  mono?: boolean;
  add?: number;
  del?: number;
  href?: string;
};

const VARIANTS: Record<
  string,
  { active: string; done: string; rows: TraceRow[]; query?: string }
> = {
  Steps: {
    active: "Retrieving & reading sources…",
    done: "Grounded in indexed documents",
    rows: [
      { primary: "Resolving conversational query intent" },
      { primary: "Scanning ChromaDB vectors & BM25 sparse index" },
      { primary: "Cross-encoder re-ranking top candidate chunks" },
      { primary: "Synthesizing answer with verified citations" },
    ],
  },
  Reasoning: {
    active: "Reasoning over document context…",
    done: "Synthesized verified claims",
    rows: [
      { primary: "Verifying facts strictly against retrieved source chunks." },
      { primary: "Filtering out ungrounded assertions to prevent hallucination." },
    ],
  },
  Search: {
    active: "Querying vector store…",
    done: "Scanned document corpus",
    query: "hybrid retrieval candidates",
    rows: [
      { primary: "Dense Vector Search", secondary: "ChromaDB" },
      { primary: "Sparse Lexical Search", secondary: "BM25" },
      { primary: "Re-ranker", secondary: "cross-encoder/ms-marco" },
    ],
  },
  Coding: {
    active: "Executing pipeline…",
    done: "Pipeline completed",
    rows: [
      { primary: "Embedding", secondary: "all-MiniLM-L6-v2", mono: true },
      { primary: "Re-ranking", secondary: "top-5 chunks", mono: true, add: 5, del: 15 },
      { primary: "Inference", secondary: "Groq LLM", mono: true },
    ],
  },
};

export default function ThinkingState({
  variant = "Steps",
  onSettled,
  rows,
  active,
  done,
  icon,
}: {
  variant?: string;
  onSettled?: () => void;
  rows?: TraceRow[];
  active?: string;
  done?: string;
  icon?: ReactNode;
}) {
  const stage = useSequence(STAGES);
  const [manualExpanded, setManualExpanded] = useState<boolean | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  const base = VARIANTS[variant] ?? VARIANTS.Steps;
  const v = {
    ...base,
    rows: rows ?? base.rows,
    active: active ?? base.active,
    done: done ?? base.done,
  };
  
  const autoExpanded = stage >= 1 && stage < 4;
  const expanded = manualExpanded ?? autoExpanded;
  const working = stage < 3;
  const visible = stage < 2 ? 0 : stage === 2 ? Math.min(2, v.rows.length) : v.rows.length;
  
  const traceRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);
  
  useIsomorphicLayoutEffect(() => {
    if (traceRef.current) setLineHeight(traceRef.current.offsetHeight);
  }, [visible, expanded, variant, stage]);

  /* Notify parent when sequence settles */
  const settledRef = useRef(false);
  useEffect(() => {
    if (working || settledRef.current) return;
    settledRef.current = true;
    onSettled?.();
  }, [working, onSettled]);

  return (
    <div
      key={variant}
      className="glass-tile my-3 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-ink-faint/20 p-3 transition-all duration-300"
    >
      {/* Header button */}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setManualExpanded((current) => !(current ?? autoExpanded))}
        className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-2.5">
          {icon ? (
            <span className="flex shrink-0 text-thermo">{icon}</span>
          ) : (
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              {working ? (
                <>
                  <span className="absolute h-full w-full animate-ping rounded-full bg-thermo/50 opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-thermo" />
                </>
              ) : (
                <span className="h-2 w-2 rounded-full bg-verified" />
              )}
            </span>
          )}

          <div role="status" className="flex items-center">
            {working ? (
              <span
                className="bg-clip-text text-xs font-semibold uppercase tracking-wider text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(201, 224, 238, 0.45) 30%, #c9e0ee 50%, rgba(201, 224, 238, 0.45) 70%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer-text 1.6s linear infinite",
                }}
              >
                {v.active}
              </span>
            ) : (
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-dim">
                {v.done}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <div className="flex items-center gap-1.5 text-xs text-ink-dim">
          <span className="text-[11px] opacity-70">{expanded ? "Hide trace" : "View trace"}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-300 text-ink-dim"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Expandable trace area */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: expanded ? "1fr" : "0fr",
          opacity: expanded ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="overflow-hidden">
          <div className="relative mt-2 ml-2 pl-4 border-l border-ink-faint/25">
            <div ref={traceRef} className="flex flex-col gap-1.5 py-1">
              {v.query && (
                <div className="flex items-center gap-2 px-1 text-xs text-ink-dim">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                  <span>{v.query}</span>
                </div>
              )}

              {v.rows.slice(0, visible).map((row, i) => {
                const isStepFinished = i < visible - 1 || !working;

                const content = (
                  <>
                    {variant === "Steps" && (
                      isStepFinished ? (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0 text-verified"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <span className="h-3 w-3 shrink-0 rounded-full border-2 border-ink-faint/30 border-t-thermo animate-spin" />
                      )
                    )}

                    <span className="min-w-0 flex-1 truncate text-xs text-ink font-medium">
                      {row.primary}
                    </span>

                    {row.secondary && (
                      <span className={`shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-ink-dim ${row.mono ? "font-mono" : ""}`}>
                        {row.secondary}
                      </span>
                    )}

                    {row.add !== undefined && (
                      <span className="shrink-0 font-mono text-[11px] tabular-nums">
                        <span className="text-verified">+{row.add}</span>{" "}
                        <span className="text-refusal">−{row.del}</span>
                      </span>
                    )}
                  </>
                );

                const rowClass = "flex min-h-6 w-full items-center gap-2.5 rounded-lg px-2 py-1 text-left";
                const animation = { animation: `fade-up 260ms cubic-bezier(0.23,1,0.32,1) ${i * 80}ms both` };

                if (variant === "Coding") {
                  const selected = selectedTool === row.primary;
                  return (
                    <button
                      key={row.primary}
                      type="button"
                      onClick={() => setSelectedTool(selected ? null : row.primary)}
                      className={`${rowClass} transition-colors ${selected ? "bg-white/10" : "hover:bg-white/5"}`}
                      style={animation}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <div key={row.primary} className={rowClass} style={animation}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
