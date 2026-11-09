"use client";

import { useState } from "react";
import { ChatSession } from "@/types";
import ConfirmModal from "./ConfirmModal";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);

  function startEditing(s: ChatSession, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  }

  function handleRename(id: string) {
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  }

  function formatTime(timestamp: number) {
    const d = new Date(timestamp * 1000);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Docked edge-to-edge Sidebar */}
      <aside
        className={`fixed md:relative z-40 flex h-full shrink-0 flex-col border-r border-hairline bg-panel backdrop-blur-md transition-all duration-300 ease-in-out ${
          isOpen ? "w-72 sm:w-80" : "w-0 p-0 overflow-hidden border-none opacity-0 md:w-0"
        } ${isOpen ? "opacity-100" : ""}`}
      >
        {/* Top bar: New Chat + Close */}
        <div className="flex items-center justify-between border-b border-hairline p-3">
          <button
            onClick={onNewChat}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white transition-all hover:brightness-110 shadow-xs"
          >
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>New Chat</span>
          </button>
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-ink-dim hover:bg-btn-subtle-hover hover:text-heading transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M11 3L5 8L11 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-xs leading-relaxed text-ink-dim">
              No conversations yet. Start asking questions to save chats.
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              const isEditing = editingId === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition-all ${
                    isActive
                      ? "bg-item-active text-heading font-medium border border-subtle shadow-xs"
                      : "text-ink-dim hover:bg-item-hover hover:text-heading"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className={`shrink-0 ${isActive ? "text-brand" : "text-ink-dim"}`}
                    >
                      <path
                        d="M2.5 4.5A1.5 1.5 0 0 1 4 3h8a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 12 12H5l-3 2.5V4.5Z"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleRename(s.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(s.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-full rounded-md border border-subtle bg-input-box px-2 py-1 text-sm text-heading focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{s.title}</div>
                        <div className="mt-0.5 text-[11px] text-ink-dim/70">
                          {formatTime(s.updated_at)} · {s.message_count} msg{s.message_count === 1 ? "" : "s"}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons (Rename & Delete) on hover */}
                  {!isEditing && (
                    <div className="ml-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => startEditing(s, e)}
                        title="Rename"
                        className="rounded-md p-1 text-ink-dim hover:bg-btn-subtle-hover hover:text-heading"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path
                            d="M9.5 2.5L11.5 4.5M2 12L2 9.5L9.5 2L12 4.5L4.5 12L2 12Z"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(s);
                        }}
                        title="Delete chat"
                        className="rounded-md p-1 text-ink-dim hover:bg-btn-subtle-hover hover:text-red-400"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path
                            d="M2 3.5h10M4.5 3.5V2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1M3 3.5l.8 8.5a1 1 0 0 0 1 .9h4.4a1 1 0 0 0 1-.9l.8-8.5"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* In-app custom confirmation modal */}
      <ConfirmModal
        isOpen={sessionToDelete !== null}
        title="Delete chat?"
        description={
          sessionToDelete
            ? `Are you sure you want to delete "${sessionToDelete.title}"? This conversation and its history cannot be recovered.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (sessionToDelete) {
            onDeleteSession(sessionToDelete.id);
            setSessionToDelete(null);
          }
        }}
        onCancel={() => setSessionToDelete(null)}
      />
    </>
  );
}
