"use client";

import { useEffect, useRef, useState } from "react";

// Apró, újrahasználható űrlap-elemek a szerkesztőhöz.

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900";

export function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={className ? `${inputBase} ${className}` : inputBase} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} min-h-[72px] resize-y leading-snug`} />;
}

export function IconButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * Szem-ikonos kapcsoló: a hozzá tartozó szekció / elem rejtését billenti.
 * `hidden=true` esetén áthúzott szemet mutat (az elem rejtve a CV-ből).
 */
export function EyeToggle({
  hidden,
  onClick,
  title,
}: {
  hidden?: boolean;
  onClick: () => void;
  title?: string;
}) {
  const label = title ?? (hidden ? "Megjelenítés a CV-ben" : "Elrejtés a CV-ből");
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={hidden}
      onClick={onClick}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${
        hidden
          ? "border-neutral-300 bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
          : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      {hidden ? (
        // szem áthúzva
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <path d="M6.61 6.61A18.5 18.5 0 0 0 2 12s3 8 10 8a9.12 9.12 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      ) : (
        // nyitott szem
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

export function SectionCard({
  title,
  action,
  hidden,
  onToggleHidden,
  onTitleChange,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  /** Ha meg van adva `onToggleHidden`, a fejlécben megjelenik a szem-kapcsoló. */
  hidden?: boolean;
  onToggleHidden?: () => void;
  /** Ha meg van adva, a cím mellett megjelenik egy ceruza-ikon; kattintásra inline szerkeszthetővé válik. */
  onTitleChange?: (newTitle: string) => void;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ha a szülő kívülről frissíti a title-t (pl. undo), a draft is frissül.
  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  function startEdit() {
    setDraft(title);
    setEditing(true);
    // Következő tick-ben fókuszálunk, mert az input még nincs a DOM-ban.
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title) onTitleChange?.(trimmed);
    else setDraft(title);
    setEditing(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
    if (e.key === "Escape") { setDraft(title); setEditing(false); }
  }

  return (
    <section
      className={`rounded-lg border p-4 shadow-sm transition ${
        hidden ? "border-neutral-200 bg-neutral-50" : "border-neutral-200 bg-white"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {onToggleHidden && (
            <EyeToggle hidden={hidden} onClick={onToggleHidden} />
          )}
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={onKeyDown}
              className="w-40 rounded border border-neutral-900 bg-white px-1.5 py-0.5 text-sm font-semibold uppercase tracking-wide text-neutral-700 outline-none focus:ring-1 focus:ring-neutral-900"
            />
          ) : (
            <h2
              className={`truncate text-sm font-semibold uppercase tracking-wide ${
                hidden ? "text-neutral-400" : "text-neutral-700"
              }`}
            >
              {title}
            </h2>
          )}
          {onTitleChange && !editing && (
            <button
              type="button"
              title="Cím szerkesztése"
              aria-label="Cím szerkesztése"
              onClick={startEdit}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </button>
          )}
          {hidden && !editing && (
            <span className="shrink-0 rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
              Rejtve
            </span>
          )}
        </div>
        {action}
      </div>
      <div className={hidden ? "opacity-50" : undefined}>{children}</div>
    </section>
  );
}
