"use client";

import { useEffect, useRef, useState } from "react";
import type { CvDocument } from "@/lib/use-cv-storage";

interface VersionTabsProps {
  documents: CvDocument[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: () => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

/**
 * Tab-sáv a CV-verziók közti váltáshoz. Egy verzióra kattintva váltunk;
 * dupla kattintással (vagy a ceruza ikonnal) átnevezhető; az ✕-szel törölhető.
 * A "+ Új verzió" friss verziót, a "Duplikálás" az aktív másolatát hozza létre.
 */
export default function VersionTabs({
  documents,
  activeId,
  onSelect,
  onAdd,
  onDuplicate,
  onRename,
  onRemove,
}: VersionTabsProps) {
  // Az épp átnevezés alatt álló verzió azonosítója (null = nincs).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.select();
  }, [editingId]);

  function startRename(doc: CvDocument) {
    setEditingId(doc.id);
    setDraft(doc.name);
  }

  function commitRename() {
    if (editingId) onRename(editingId, draft);
    setEditingId(null);
  }

  function handleRemove(doc: CvDocument) {
    if (documents.length === 1) {
      // Az utolsó verziót is törölhetjük — ekkor új, üres verzió jön létre.
      if (confirm(`Törlöd a(z) „${doc.name}” verziót? Egy új, üres verzió jön létre helyette.`)) {
        onRemove(doc.id);
      }
      return;
    }
    if (confirm(`Törlöd a(z) „${doc.name}” verziót? Ez nem vonható vissza.`)) {
      onRemove(doc.id);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-neutral-200 bg-white/90 p-2 shadow-sm backdrop-blur">
      <div role="tablist" aria-label="CV-verziók" className="flex flex-wrap items-center gap-1.5">
        {documents.map((doc) => {
          const active = doc.id === activeId;
          const isEditing = editingId === doc.id;
          return (
            <div
              key={doc.id}
              role="tab"
              aria-selected={active}
              className={`group flex items-center gap-1 rounded-md border px-2 py-1 text-sm transition ${
                active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="w-28 rounded bg-white px-1 py-0.5 text-sm text-neutral-900 outline-none ring-1 ring-neutral-900"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(doc.id)}
                  onDoubleClick={() => startRename(doc)}
                  title="Kattints a váltáshoz, dupla kattintás az átnevezéshez"
                  className="max-w-[180px] truncate font-medium"
                >
                  {doc.name}
                </button>
              )}

              {!isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => startRename(doc)}
                    title="Átnevezés"
                    aria-label="Átnevezés"
                    className={`shrink-0 rounded px-0.5 text-xs opacity-0 transition group-hover:opacity-70 hover:!opacity-100 ${
                      active ? "text-white" : "text-neutral-500"
                    }`}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(doc)}
                    title="Verzió törlése"
                    aria-label="Verzió törlése"
                    className={`shrink-0 rounded px-0.5 text-xs opacity-0 transition group-hover:opacity-70 hover:!opacity-100 ${
                      active ? "text-white" : "text-neutral-500"
                    }`}
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onDuplicate}
          title="Az aktív verzió másolása"
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          Duplikálás
        </button>
        <button
          type="button"
          onClick={onAdd}
          title="Új, üres verzió"
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          + Új verzió
        </button>
      </div>
    </div>
  );
}
