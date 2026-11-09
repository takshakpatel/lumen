"use client";

import { Message } from "@/types";
import SourcePins from "./SourcePins";

interface MessageBubbleProps {
  message: Message;
  enterClass?: string;
}

function RefusalMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true" className="inline mr-1 text-refusal">
      <path
        d="M6.5 1.5v6M6.5 10.5h.01"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AssistantMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="M6.5 1.5c1.3 1.3 3.7 2.4 3.7 4.8A3.7 3.7 0 0 1 6.5 9.7 3.7 3.7 0 0 1 2.8 6.3c0-2.4 2.4-3.5 3.7-4.8Z"
        fill="url(#assistg)"
      />
      <defs>
        <linearGradient id="assistg" x1="2.8" y1="1.5" x2="2.8" y2="9.7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b7cf6" />
          <stop offset="1" stopColor="#4cc9f0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Remove bracketed citation tags like [1][2] or [Source 1] from displayed text.
 * Citations are already presented interactively in SourcePins.
 */
function cleanCitations(content: string): string {
  return content
    .replace(/(\s*\[(?:(?:source\s*)?\d+|,\s*|\s*-\s*)+\])+/gi, "")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

export default function MessageBubble({ message, enterClass = "sink-enter" }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isRefusal =
    !isUser &&
    message.content.length < 160 &&
    /(don't have enough|cannot answer|no information|not enough|unable to answer|context does not contain)/i.test(
      message.content
    );

  if (isUser) {
    return (
      <div className={`mb-4 flex justify-end ${enterClass}`}>
        <div className="bubble-user max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2.5 shadow-xs">
          <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  const displayContent = cleanCitations(message.content);

  return (
    <div className={`mb-5 flex justify-start ${enterClass}`}>
      <div className="flex max-w-[85%] items-start gap-3">
        {/* Assistant Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand border border-brand/20 shadow-xs mt-0.5">
          <AssistantMark />
        </div>

        {/* Message bubble */}
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold text-heading">Lumen</span>
            <span className="digits text-[10px] uppercase tracking-wider text-ink-dim">
              {isRefusal ? "Notice" : "AI"}
            </span>
          </div>
          <div
            className={`overflow-hidden rounded-2xl rounded-tl-sm border border-hairline bg-card-surface px-4 py-3 shadow-xs ${
              isRefusal ? "border-refusal/40" : ""
            }`}
          >
            <p className={`text-sm leading-relaxed ${isRefusal ? "text-refusal" : "text-reply"} whitespace-pre-wrap`}>
              {isRefusal && <RefusalMark />}
              {displayContent}
            </p>
            {message.sources && <SourcePins sources={message.sources} />}
          </div>
        </div>
      </div>
    </div>
  );
}
