"use client";

import { emptyTimelineEntry, type TimelineEntry } from "@/lib/cv-types";
import { Field, IconButton, SectionCard, TextArea, TextInput } from "./fields";

// Egységes szerkesztő az időrendi szekciókhoz (Work Experience / Projects / Education).
// A szülő csak az értéklistát és a setter-t adja át.

export default function TimelineEditor({
  title,
  entries,
  onChange,
}: {
  title: string;
  entries: TimelineEntry[];
  onChange: (next: TimelineEntry[]) => void;
}) {
  function update(id: string, patch: Partial<TimelineEntry>) {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function remove(id: string) {
    onChange(entries.filter((e) => e.id !== id));
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= entries.length) return;
    const next = [...entries];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function add() {
    onChange([...entries, emptyTimelineEntry()]);
  }

  return (
    <SectionCard
      title={title}
      action={
        <button
          type="button"
          onClick={add}
          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          + Hozzáadás
        </button>
      }
    >
      <div className="space-y-4">
        {entries.length === 0 && (
          <p className="text-xs text-neutral-400">Nincs bejegyzés.</p>
        )}
        {entries.map((entry, index) => (
          <div key={entry.id} className="rounded-md border border-neutral-200 p-3">
            <div className="mb-2 flex items-center justify-end gap-1">
              <IconButton
                title="Fel"
                onClick={() => move(index, -1)}
                disabled={index === 0}
              >
                ↑
              </IconButton>
              <IconButton
                title="Le"
                onClick={() => move(index, 1)}
                disabled={index === entries.length - 1}
              >
                ↓
              </IconButton>
              <IconButton title="Törlés" onClick={() => remove(entry.id)}>
                ✕
              </IconButton>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Időszak">
                <TextInput
                  value={entry.period}
                  onChange={(e) => update(entry.id, { period: e.target.value })}
                  placeholder="2024. 08. – PRESENT"
                />
              </Field>
              <Field label="Hely / cég">
                <TextInput
                  value={entry.organization}
                  onChange={(e) => update(entry.id, { organization: e.target.value })}
                  placeholder="IVY TECHNOLOGY KFT."
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Pozíció / cím">
                <TextInput
                  value={entry.title}
                  onChange={(e) => update(entry.id, { title: e.target.value })}
                  placeholder="JUNIOR JAVA BACKEND DEVELOPER"
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Leírás">
                <TextArea
                  value={entry.description}
                  onChange={(e) => update(entry.id, { description: e.target.value })}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
