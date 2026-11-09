"use client";

import { useEffect, useState, useCallback } from "react";
import IngestPanel from "@/components/IngestPanel";
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import { ChatSession } from "@/types";
import { fetchSessions, renameSession, deleteSession } from "@/lib/api";

function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("rag-deepdive-theme") as "dark" | "light") || "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("theme-light", saved === "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("rag-deepdive-theme", next);
    document.documentElement.classList.toggle("theme-light", next === "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline bg-btn-subtle text-ink-dim transition-colors hover:bg-btn-subtle-hover hover:text-heading shadow-xs"
    >
      {theme === "dark" ? (
        <svg width="15" height="15" viewBox="0 0 17 17" fill="none" aria-hidden="true">
          <path
            d="M6.3 2.6a5.4 5.4 0 1 0 7.6 6.5A4.4 4.4 0 0 1 6.3 2.6Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 17 17" fill="none" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="3.4" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M8.5 1.8v1.8M8.5 13.4v1.8M1.8 8.5h1.8M13.4 8.5h1.8M3.6 3.6l1.3 1.3M12.1 12.1l1.3 1.3M13.4 3.6l-1.3 1.3M4.9 12.1l-1.3 1.3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}

export default function Home() {
  const [status, setStatus] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch (e) {
      console.error("Failed to fetch chat sessions:", e);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleNewChat = () => {
    setActiveSessionId(null);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleRenameSession = async (id: string, newTitle: string) => {
    try {
      await renameSession(id, newTitle);
      loadSessions();
    } catch (e) {
      console.error("Failed to rename session:", e);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      if (activeSessionId === id) {
        setActiveSessionId(null);
      }
      loadSessions();
    } catch (e) {
      console.error("Failed to delete session:", e);
    }
  };

  const handleSessionCreated = (id: string) => {
    setActiveSessionId(id);
    loadSessions();
  };

  return (
    <div className="depth-canvas relative flex h-screen w-screen flex-col bg-ground text-ink overflow-hidden transition-colors duration-200">
      {/* Edge-to-edge Top Header */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-panel px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen((v) => !v)}
            aria-label="Toggle chat history"
            title="Toggle chat history"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-dim hover:bg-btn-subtle-hover hover:text-heading transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-base font-semibold tracking-tight text-heading">Lumen</span>
            <span className="hidden text-xs text-ink-dim sm:inline-block border-l border-hairline pl-2.5">
              Grounded answers from your documents
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Workspace: flush docked Sidebar & Chat with hairline partition */}
      <main className="relative z-10 flex w-full min-h-0 flex-1 overflow-hidden">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((v) => !v)}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <IngestPanel onIngested={setStatus} lastIngestedStatus={status} />
          <Chat
            activeSessionId={activeSessionId}
            onSessionCreated={handleSessionCreated}
            onSessionUpdated={loadSessions}
            onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
            isSidebarOpen={isSidebarOpen}
          />
        </div>
      </main>
    </div>
  );
}
