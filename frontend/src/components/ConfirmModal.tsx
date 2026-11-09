"use client";

import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key to cancel and auto-focus cancel button for safety
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    // Focus the cancel button so accidental Enter does not delete
    cancelBtnRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-hairline bg-card-surface p-5 shadow-2xl transition-all"
        style={{ animation: "fade-up 180ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          {/* Warning Icon */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              variant === "danger"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-brand/10 text-brand border border-brand/20"
            }`}
          >
            {variant === "danger" ? (
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M8 2.5v6M8 11.5h.01"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 id="confirm-modal-title" className="text-base font-semibold text-heading">
              {title}
            </h3>
            <p id="confirm-modal-desc" className="mt-1.5 text-xs leading-relaxed text-ink-dim">
              {description}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-hairline bg-btn-subtle px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-btn-subtle-hover hover:text-heading"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-medium text-white transition-all shadow-xs ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-500 hover:brightness-110"
                : "bg-brand hover:brightness-110"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
