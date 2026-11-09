"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Message } from "@/types";
import { queryDocuments, fetchSessionDetail, createSession } from "@/lib/api";
import MessageBubble, { AssistantMark } from "./MessageBubble";
import LoadingState from "./LoadingState";

interface ChatProps {
  activeSessionId: string | null;
  onSessionCreated?: (sessionId: string) => void;
  onSessionUpdated?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function Chat({
  activeSessionId,
  onSessionCreated,
  onSessionUpdated,
  onToggleSidebar,
  isSidebarOpen,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sendPulse, setSendPulse] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ref tracking a session ID that was just created locally by handleSend.
  // This prevents the activeSessionId useEffect from overwriting in-flight messages with an empty DB state.
  const justCreatedSessionIdRef = useRef<string | null>(null);
  const activeSessionIdRef = useRef<string | null>(activeSessionId);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  const scrolling = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  // Load messages when activeSessionId changes (e.g., clicking on another session in sidebar)
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    // If this session was just created locally during handleSend, we already have
    // the user's message in local state — do NOT wipe it or fetch empty DB history!
    if (justCreatedSessionIdRef.current === activeSessionId) {
      justCreatedSessionIdRef.current = null;
      return;
    }

    let isMounted = true;
    setHistoryLoading(true);

    fetchSessionDetail(activeSessionId)
      .then((data) => {
        if (isMounted) {
          setMessages(data.messages || []);
        }
      })
      .catch((err) => {
        console.error("Failed to load session history:", err);
      })
      .finally(() => {
        if (isMounted) setHistoryLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSessionId]);

  useEffect(() => {
    scrolling();
  }, [messages, loading, scrolling]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    // 1. Optimistic UI: Immediately show the user's prompt and start the loading animation
    const userMsg: Message = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSendPulse((p) => p + 1);
    setLoading(true);

    let currentSessionId = activeSessionId;

    // 2. If no session exists yet (first prompt in New Chat), create it
    if (!currentSessionId) {
      try {
        const newSess = await createSession(text.slice(0, 35));
        currentSessionId = newSess.id;
        // Mark this session ID as just-created so activeSessionId effect won't wipe state
        justCreatedSessionIdRef.current = newSess.id;
        if (onSessionCreated) {
          onSessionCreated(currentSessionId);
        }
      } catch (e) {
        console.error("Failed to create session, proceeding with default session", e);
      }
    }

    try {
      const res = await queryDocuments(text, 5, currentSessionId);
      const botMsg: Message = {
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        tokens: res.tokens,
        latency_ms: res.latency_ms,
        timestamp: Date.now(),
      };

      // Only append if the user hasn't switched to a different session in the meantime
      if (
        activeSessionIdRef.current === currentSessionId ||
        justCreatedSessionIdRef.current === currentSessionId ||
        (!activeSessionIdRef.current && !currentSessionId)
      ) {
        setMessages((prev) => [...prev, botMsg]);
      }

      if (onSessionUpdated) {
        onSessionUpdated();
      }
    } catch (e: any) {
      const isTimeout = e?.name === "AbortError" || /timed? ?out|aborted/i.test(e?.message || "");
      const friendly = isTimeout
        ? "The request took too long. Your local model may have been loading or busy — try asking again."
        : `I couldn't complete that query. ${e?.message ? `${e.message} ` : ""}Please try again or rephrase slightly.`;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: friendly,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    if (loading) return;
    setMessages([]);
    setInput("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
      {/* Sub-header status bar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-hairline px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-ink-dim">
            {messages.length === 0 ? "Empty conversation" : `${messages.length} message${messages.length === 1 ? "" : "s"}`}
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            disabled={loading}
            aria-label="Clear chat"
            title="Clear chat"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ink-dim transition-colors hover:bg-btn-subtle-hover hover:text-heading disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1.5 3h11M4 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M5.5 6v3.5M8.5 6v3.5M2.5 3l.5 8.5a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9l.5-8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Clear view
          </button>
        )}
      </div>

      {/* Messages: Full width edge-to-edge chat canvas */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="flex min-h-full w-full flex-col justify-between">
          {historyLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex items-center gap-2 text-xs text-ink-dim">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                Loading conversation history...
              </div>
            </div>
          ) : messages.length === 0 && !loading ? (
            /* Perfectly centered hero for empty new chats */
            <div className="my-auto flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="group">
                <div className="brand-tile flex h-14 w-14 items-center justify-center rounded-2xl bg-brand shadow-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      className="brand-page brand-page-left"
                      d="M12 5.6 C9.1 4.2 5.9 4.9 4 7.4 L4 18 C6.6 16.4 9.3 15.9 12 17.4 Z"
                      fill="#fff"
                      fillOpacity="0.4"
                    />
                    <path
                      className="brand-page brand-page-right"
                      d="M12 5.6 C14.9 4.2 18.1 4.9 20 7.4 L20 18 C17.4 16.4 14.7 15.9 12 17.4 Z"
                      fill="#fff"
                    />
                    <path
                      className="brand-spine"
                      d="M12 5.6 L12 17.4"
                      stroke="#fff"
                      strokeOpacity="0.75"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="max-w-md">
                <p className="text-lg font-semibold text-heading">Ask Lumen anything about your documents</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-dim">
                  Upload a file, then ask a question. Every answer is grounded in
                  your sources with inline citations and document excerpts.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id || i}
                  message={msg}
                  enterClass={i === messages.length - 1 ? "dive-enter" : "sink-enter"}
                />
              ))}

              {/* Left-anchored Loading State with Assistant Avatar */}
              {loading && (
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand border border-brand/20 shadow-xs mt-0.5">
                    <AssistantMark />
                  </div>
                  <div className="pt-1.5">
                    <LoadingState label="Searching documents & thinking..." />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modern Full-Width Input Dock */}
      <div className="border-t border-hairline bg-panel px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="w-full">
          <div className="flex items-end gap-2 rounded-2xl border border-input-line bg-input-box p-2 transition-all focus-within:border-brand/60 focus-within:ring-1 focus-within:ring-brand/40 shadow-xs">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a question or follow-up…"
                rows={1}
                className="min-h-11 w-full resize-none rounded-xl bg-transparent px-3 py-2 text-sm leading-6 text-reply placeholder-ink-dim/50 focus:outline-none max-h-40"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 shadow-xs"
            >
              <svg
                key={sendPulse}
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className={`${sendPulse > 0 ? "nudge" : ""}`}
              >
                <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
