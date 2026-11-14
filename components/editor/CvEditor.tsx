"use client";

import { useRef, useState } from "react";
import {
  ACCENT_PALETTE,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_MARGIN_BOTTOM_MM,
  DEFAULT_MARGIN_X_MM,
  DEFAULT_MARGIN_Y_MM,
  DEFAULT_PHOTO_WIDTH_PX,
  DEFAULT_SECTION_INDENT_MM,
  DEFAULT_SECTION_TITLES,
  MAX_PHOTO_OFFSET_X_MM,
  MAX_PHOTO_WIDTH_PX,
  MIN_PHOTO_OFFSET_X_MM,
  MIN_PHOTO_WIDTH_PX,
  PHOTO_ASPECT,
  emptyContact,
  emptySkill,
  type ContactItem,
  type CvData,
  type PhotoCrop,
  type PhotoShape,
  type SectionKey,
} from "@/lib/cv-types";
import { migrate, useCvWorkspace } from "@/lib/use-cv-storage";
import ResumePreview from "@/components/ResumePreview";
import TimelineEditor from "./TimelineEditor";
import PhotoCropper from "./PhotoCropper";
import VersionTabs from "./VersionTabs";
import { EyeToggle, Field, IconButton, SectionCard, TextArea, TextInput } from "./fields";

export default function CvEditor() {
  const {
    cv,
    setCv,
    loaded,
    resetCv,
    documents,
    activeId,
    selectVersion,
    addVersion,
    duplicateVersion,
    renameVersion,
    removeVersion,
  } = useCvWorkspace();
  const importInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  // A szerkesztendő (eredeti) kép forrása; null = nincs nyitva a cropper.
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  // A szerkesztőbe betöltendő korábbi kivágás (újraszerkesztéskor), különben null.
  const [cropInitial, setCropInitial] = useState<PhotoCrop | null>(null);

  // Részleges frissítő — a megadott mezőket cseréli a CV-ben.
  function patch(p: Partial<CvData>) {
    setCv((prev) => ({ ...prev, ...p }));
  }

  // ── Elérhetőségek ──────────────────────────────────────────
  function updateContact(id: string, c: Partial<ContactItem>) {
    patch({ contacts: cv.contacts.map((x) => (x.id === id ? { ...x, ...c } : x)) });
  }
  function removeContact(id: string) {
    patch({ contacts: cv.contacts.filter((x) => x.id !== id) });
  }
  function addContact() {
    patch({ contacts: [...cv.contacts, emptyContact()] });
  }

  // ── Skillek ────────────────────────────────────────────────
  function updateSkill(id: string, value: string) {
    patch({ skills: cv.skills.map((s) => (s.id === id ? { ...s, text: value } : s)) });
  }
  function toggleSkillHidden(id: string) {
    patch({ skills: cv.skills.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)) });
  }
  function removeSkill(id: string) {
    patch({ skills: cv.skills.filter((s) => s.id !== id) });
  }
  function addSkill() {
    patch({ skills: [...cv.skills, emptySkill()] });
  }

  // ── Szekciók rejtése ───────────────────────────────────────
  function sectionHidden(key: SectionKey) {
    return (cv.hiddenSections ?? []).includes(key);
  }
  function toggleSection(key: SectionKey) {
    const set = new Set(cv.hiddenSections ?? []);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    patch({ hiddenSections: [...set] });
  }

  // ── Profilkép ──────────────────────────────────────────────
  // Új feltöltéskor friss képpel, korábbi kivágás nélkül nyitjuk a szerkesztőt.
  function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Csak képfájl tölthető fel.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropInitial(null);
      setCropSrc(String(reader.result));
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // ugyanaz a fájl újra kiválasztható legyen
  }

  // Meglévő kép újraszerkesztése: az EREDETI képet töltjük be (ha van),
  // a korábban alkalmazott kivágás beállításaival.
  function onEditPhoto() {
    setCropInitial(cv.photoCrop ?? null);
    setCropSrc(cv.photoOriginalDataUrl || cv.photoDataUrl);
  }

  function onCropConfirm({ dataUrl, crop }: { dataUrl: string; crop: PhotoCrop }) {
    // A megjelenített kép a kivágott; az eredetit és a beállításokat megőrizzük.
    patch({
      photoDataUrl: dataUrl,
      photoOriginalDataUrl: cropSrc ?? "",
      photoCrop: crop,
    });
    setCropSrc(null);
    setCropInitial(null);
  }

  function onRemovePhoto() {
    patch({ photoDataUrl: "", photoOriginalDataUrl: "", photoCrop: undefined });
  }

  // ── Export / Import ────────────────────────────────────────
  function exportJson() {
    const blob = new Blob([JSON.stringify(cv, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = `${cv.firstName}-${cv.lastName}`.toLowerCase().replace(/\s+/g, "-") || "cv";
    a.href = url;
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function onImportSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (typeof parsed?.firstName === "string" && Array.isArray(parsed?.experience)) {
          // Az importált CV ÚJ verzióként nyílik meg, hogy a meglévő verziók
          // ne íródjanak felül. A nevet a fájlból / a névből próbáljuk kitalálni.
          const baseName = file.name.replace(/\.json$/i, "").trim();
          const personName = `${parsed.firstName ?? ""} ${parsed.lastName ?? ""}`.trim();
          // Importkor is felhozzuk az aktuális sémára (pl. régi string-skillek).
          addVersion(migrate(parsed as CvData), baseName || personName || undefined);
        } else {
          alert("A fájl nem érvényes CV JSON.");
        }
      } catch {
        alert("Nem sikerült beolvasni a JSON-t.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function onReset() {
    if (confirm("Visszaállítod az alapértelmezett (minta) CV-t? A jelenlegi módosítások elvesznek.")) {
      resetCv();
    }
  }

  // A hidratáció előtt ne villogjon a tartalom.
  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-neutral-400">
        Betöltés…
      </div>
    );
  }

  return (
    <>
    <div className="screen-only mx-auto max-w-[1500px] p-4 lg:p-6">
      {/* ── Verzió-tabok: váltás / létrehozás / átnevezés / törlés ── */}
      <div className="mb-4">
        <VersionTabs
          documents={documents}
          activeId={activeId}
          onSelect={selectVersion}
          onAdd={() => addVersion()}
          onDuplicate={duplicateVersion}
          onRename={renameVersion}
          onRemove={removeVersion}
        />
      </div>

      <div className="flex gap-6">
      {/* ── Bal oldal: szerkesztő űrlap ── (nyomtatáskor elrejtve) */}
      <div className="w-full max-w-[640px] shrink-0 space-y-4">
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white/90 p-3 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Nyomtatás / PDF
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Import JSON
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            onChange={onImportSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={onReset}
            className="ml-auto rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100"
          >
            Visszaállítás
          </button>
        </div>

        {/* Lap beállítások */}
        <SectionCard title="Lap">
          <div className="space-y-3">
            <Field label={`Felső margó: ${cv.marginY ?? DEFAULT_MARGIN_Y_MM} mm`}>
              <input
                type="range"
                min={8}
                max={30}
                step={1}
                value={cv.marginY ?? DEFAULT_MARGIN_Y_MM}
                onChange={(e) => patch({ marginY: Number(e.target.value) })}
                className="w-full accent-neutral-900"
              />
            </Field>
            <Field label={`Alsó margó: ${cv.marginBottom ?? DEFAULT_MARGIN_BOTTOM_MM} mm`}>
              <input
                type="range"
                min={8}
                max={30}
                step={1}
                value={cv.marginBottom ?? DEFAULT_MARGIN_BOTTOM_MM}
                onChange={(e) => patch({ marginBottom: Number(e.target.value) })}
                className="w-full accent-neutral-900"
              />
            </Field>
            <Field label={`Oldalsó margó: ${cv.marginX ?? DEFAULT_MARGIN_X_MM} mm`}>
              <input
                type="range"
                min={8}
                max={30}
                step={1}
                value={cv.marginX ?? DEFAULT_MARGIN_X_MM}
                onChange={(e) => patch({ marginX: Number(e.target.value) })}
                className="w-full accent-neutral-900"
              />
            </Field>
            <Field
              label={`Szekció behúzás: ${cv.sectionIndent ?? DEFAULT_SECTION_INDENT_MM} mm`}
            >
              <input
                type="range"
                min={0}
                max={15}
                step={1}
                value={cv.sectionIndent ?? DEFAULT_SECTION_INDENT_MM}
                onChange={(e) => patch({ sectionIndent: Number(e.target.value) })}
                className="w-full accent-neutral-900"
              />
            </Field>
            <Field label="Kiemelő szín">
              <div className="flex flex-wrap gap-2">
                {ACCENT_PALETTE.map(({ label, color }) => {
                  const active = (cv.accentColor ?? DEFAULT_ACCENT_COLOR) === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      title={label}
                      aria-label={label}
                      onClick={() => patch({ accentColor: color })}
                      className={`h-7 w-7 rounded-full border-2 transition ${
                        active ? "border-neutral-900 scale-110" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* Fejléc */}
        <SectionCard title="Fejléc">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Keresztnév">
              <TextInput
                value={cv.firstName}
                onChange={(e) => patch({ firstName: e.target.value.toUpperCase() })}
                className="uppercase"
              />
            </Field>
            <Field label="Vezetéknév">
              <TextInput
                value={cv.lastName}
                onChange={(e) => patch({ lastName: e.target.value.toUpperCase() })}
                className="uppercase"
              />
            </Field>
          </div>

          {/* Profilkép */}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => (cv.photoDataUrl ? onEditPhoto() : photoInputRef.current?.click())}
              title={cv.photoDataUrl ? "Kép szerkesztése" : "Kép feltöltése"}
              className="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border border-neutral-200 bg-neutral-100"
            >
              {cv.photoDataUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cv.photoDataUrl} alt="" className="h-full w-full object-cover" />
                  {/* Hover overlay: jelzi, hogy kattintásra szerkeszthető */}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                    Szerkesztés
                  </span>
                </>
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400 transition group-hover:text-neutral-600">
                  nincs
                </span>
              )}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Kép feltöltése
              </button>
              {cv.photoDataUrl && (
                <>
                  <button
                    type="button"
                    onClick={onEditPhoto}
                    className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                  >
                    Szerkesztés
                  </button>
                  <button
                    type="button"
                    onClick={onRemovePhoto}
                    className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100"
                  >
                    Eltávolítás
                  </button>
                </>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={onPhotoSelected}
              className="hidden"
            />
          </div>

          {/* Kép elrendezése: forma, méret és vízszintes eltolás. */}
          <div className="mt-3 space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
            <Field label="Kép formája">
              <div className="flex gap-2">
                {(["square", "portrait"] as PhotoShape[]).map((shape) => {
                  const active = (cv.photoShape ?? "square") === shape;
                  return (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => patch({ photoShape: shape })}
                      className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                        active
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      {shape === "square" ? "Négyzet" : "Portré"}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label={`Kép mérete: ${cv.photoWidth ?? DEFAULT_PHOTO_WIDTH_PX} px`}>
              <input
                type="range"
                min={MIN_PHOTO_WIDTH_PX}
                max={MAX_PHOTO_WIDTH_PX}
                step={1}
                value={cv.photoWidth ?? DEFAULT_PHOTO_WIDTH_PX}
                onChange={(e) => patch({ photoWidth: Number(e.target.value) })}
                className="w-full accent-neutral-900"
              />
            </Field>
            <Field label={`Vízszintes eltolás: ${cv.photoOffsetX ?? 0} mm`}>
              <input
                type="range"
                min={MIN_PHOTO_OFFSET_X_MM}
                max={MAX_PHOTO_OFFSET_X_MM}
                step={1}
                value={cv.photoOffsetX ?? 0}
                onChange={(e) => patch({ photoOffsetX: Number(e.target.value) })}
                className="w-full accent-neutral-900"
              />
            </Field>
          </div>

          {/* Elérhetőségek */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">Elérhetőségek</span>
              <button
                type="button"
                onClick={addContact}
                className="rounded-md border border-neutral-300 bg-white px-2 py-0.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                + Hozzáadás
              </button>
            </div>
            <div className="space-y-2">
              {cv.contacts.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className={`flex flex-1 gap-2 ${c.hidden ? "opacity-50" : ""}`}>
                    <TextInput
                      value={c.text}
                      onChange={(e) => updateContact(c.id, { text: e.target.value })}
                      placeholder="Megjelenő szöveg"
                    />
                    <TextInput
                      value={c.url ?? ""}
                      onChange={(e) => updateContact(c.id, { url: e.target.value })}
                      placeholder="Link (opcionális)"
                    />
                  </span>
                  <label
                    title="Új sorban kezdődik a fejlécben"
                    className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-neutral-500"
                  >
                    <input
                      type="checkbox"
                      checked={!!c.newLine}
                      onChange={(e) => updateContact(c.id, { newLine: e.target.checked })}
                    />
                    új sor
                  </label>
                  <EyeToggle
                    hidden={c.hidden}
                    onClick={() => updateContact(c.id, { hidden: !c.hidden })}
                  />
                  <IconButton title="Törlés" onClick={() => removeContact(c.id)}>
                    ✕
                  </IconButton>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Bevezető */}
        <SectionCard
          title="Bevezető"
          hidden={sectionHidden("summary")}
          onToggleHidden={() => toggleSection("summary")}
        >
          <TextArea
            value={cv.summary}
            onChange={(e) => patch({ summary: e.target.value })}
          />
        </SectionCard>

        <TimelineEditor
          title={cv.sectionTitles?.experience ?? DEFAULT_SECTION_TITLES.experience}
          entries={cv.experience}
          onChange={(experience) => patch({ experience })}
          hidden={sectionHidden("experience")}
          onToggleHidden={() => toggleSection("experience")}
          onTitleChange={(t) => patch({ sectionTitles: { ...DEFAULT_SECTION_TITLES, ...cv.sectionTitles, experience: t } })}
        />
        <TimelineEditor
          title={cv.sectionTitles?.projects ?? DEFAULT_SECTION_TITLES.projects}
          entries={cv.projects}
          onChange={(projects) => patch({ projects })}
          hidden={sectionHidden("projects")}
          onToggleHidden={() => toggleSection("projects")}
          onTitleChange={(t) => patch({ sectionTitles: { ...DEFAULT_SECTION_TITLES, ...cv.sectionTitles, projects: t } })}
        />
        <TimelineEditor
          title={cv.sectionTitles?.education ?? DEFAULT_SECTION_TITLES.education}
          entries={cv.education}
          onChange={(education) => patch({ education })}
          hidden={sectionHidden("education")}
          onToggleHidden={() => toggleSection("education")}
          onTitleChange={(t) => patch({ sectionTitles: { ...DEFAULT_SECTION_TITLES, ...cv.sectionTitles, education: t } })}
        />

        {/* Kompetenciák */}
        <SectionCard
          title={cv.sectionTitles?.competences ?? DEFAULT_SECTION_TITLES.competences}
          hidden={sectionHidden("competences")}
          onToggleHidden={() => toggleSection("competences")}
          onTitleChange={(t) => patch({ sectionTitles: { ...DEFAULT_SECTION_TITLES, ...cv.sectionTitles, competences: t } })}
          action={
            <button
              type="button"
              onClick={addSkill}
              className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              + Hozzáadás
            </button>
          }
        >
          <div className="space-y-2">
            {cv.skills.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className={`flex-1 ${s.hidden ? "opacity-50" : ""}`}>
                  <TextInput value={s.text} onChange={(e) => updateSkill(s.id, e.target.value)} />
                </span>
                <EyeToggle hidden={s.hidden} onClick={() => toggleSkillHidden(s.id)} />
                <IconButton title="Törlés" onClick={() => removeSkill(s.id)}>
                  ✕
                </IconButton>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Jobb oldal: élő előnézet (csak képernyőn, kicsinyítve) ── */}
      <div className="hidden flex-1 justify-center lg:flex">
        <div className="sticky top-6 h-fit">
          <div
            className="origin-top shadow-xl ring-1 ring-neutral-200"
            style={{ transform: "scale(0.78)" }}
          >
            <ResumePreview cv={cv} />
          </div>
        </div>
      </div>
      </div>
    </div>

    {/* ── Nyomtatáshoz / PDF-hez: skálázatlan, teljes méretű előnézet ── */}
    <div className="print-only">
      <ResumePreview cv={cv} />
    </div>

    {/* ── Kép-szerkesztő (zoom + körbevágás) ── */}
    {cropSrc && (
      <PhotoCropper
        src={cropSrc}
        initialCrop={cropInitial}
        aspect={PHOTO_ASPECT[cv.photoShape ?? "square"]}
        onCancel={() => {
          setCropSrc(null);
          setCropInitial(null);
        }}
        onConfirm={onCropConfirm}
      />
    )}
    </>
  );
}
