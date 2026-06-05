"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CV_SCHEMA_VERSION,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_MARGIN_BOTTOM_MM,
  DEFAULT_MARGIN_X_MM,
  DEFAULT_MARGIN_Y_MM,
  DEFAULT_PHOTO_WIDTH_PX,
  DEFAULT_SECTION_INDENT_MM,
  DEFAULT_SECTION_TITLES,
  createId,
  type CvData,
  type SkillItem,
} from "./cv-types";
import { defaultCv } from "./default-cv";

// Az új, több-verziós tároló kulcsa. A régi (egy CV-s) adatot az első
// betöltéskor felhozzuk ebbe a formába — lásd readStoredWorkspace().
const WORKSPACE_KEY = "cv-generator:workspace";
const LEGACY_KEY = "cv-generator:data";
const WORKSPACE_VERSION = 1;
const SAVE_DEBOUNCE_MS = 400;

/** Egy mentett CV-verzió: saját azonosító, megjelenő név és a CV adatai. */
export interface CvDocument {
  id: string;
  name: string;
  data: CvData;
}

/** A teljes munkaterület: az összes verzió és az épp aktív azonosítója. */
export interface CvWorkspace {
  workspaceVersion: number;
  activeId: string;
  documents: CvDocument[];
}

// Hidratáció-biztos "kliensen vagyunk-e" jelzés setState nélkül:
// szerveren false-t, kliensen (mount után) true-t ad. Így a szerver és a
// kliens első renderje megegyezik, nincs hidratációs eltérés.
const noopSubscribe = () => () => {};

/** Lazán ellenőrzi, hogy a betöltött objektum CV-nek tűnik-e. */
function isCvLike(value: unknown): value is CvData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.firstName === "string" &&
    Array.isArray(v.experience) &&
    Array.isArray(v.skills)
  );
}

/** Régi sémájú mentett adat felhozása az aktuális verzióra. */
export function migrate(cv: CvData): CvData {
  const next = { ...cv };
  // v2: a kapcsolati adatok két sorba törhetők. Ha még egyik elem sincs új
  // sorra jelölve, az első linkkel rendelkező elemet (jellemzően az e-mail)
  // tesszük a második sor elejére — így a régi adat is a kívánt elrendezést kapja.
  if ((cv.schemaVersion ?? 1) < 2 && Array.isArray(next.contacts)) {
    const hasBreak = next.contacts.some((c) => c.newLine);
    if (!hasBreak) {
      const firstLink = next.contacts.find((c) => c.url);
      if (firstLink) {
        next.contacts = next.contacts.map((c) =>
          c === firstLink ? { ...c, newLine: true } : c
        );
      }
    }
  }
  // v3–v4: lapmargó. A v3-ban egységes `pageMargin` volt; a v4-ben külön
  // felső/alsó és oldalsó. A régi értéket szétosztjuk mindkettőre.
  const legacyMargin = (next as { pageMargin?: number }).pageMargin;
  if (typeof next.marginY !== "number") {
    next.marginY = typeof legacyMargin === "number" ? legacyMargin : DEFAULT_MARGIN_Y_MM;
  }
  if (typeof next.marginX !== "number") {
    next.marginX = typeof legacyMargin === "number" ? legacyMargin : DEFAULT_MARGIN_X_MM;
  }
  delete (next as { pageMargin?: number }).pageMargin;

  // v6: szekció-behúzás. Korábbi adatban nincs — a fix korábbi értéknek
  // megfelelő alapértékkel pótoljuk.
  if (typeof next.sectionIndent !== "number") {
    next.sectionIndent = DEFAULT_SECTION_INDENT_MM;
  }

  // v7: kép elrendezése (forma, méret, vízszintes eltolás). Korábbi adatban a
  // kép fix négyzetes és a margóhoz tapadt volt — ennek megfelelő alapértékek.
  if (next.photoShape !== "portrait") next.photoShape = "square";
  if (typeof next.photoWidth !== "number") next.photoWidth = DEFAULT_PHOTO_WIDTH_PX;
  if (typeof next.photoOffsetX !== "number") next.photoOffsetX = 0;

  // v8: a kompetenciák elemenként elrejthetők, ezért sima string helyett
  // objektummá (id + szöveg + rejtve jelző) alakítjuk a régi adatot.
  if (Array.isArray(next.skills)) {
    next.skills = (next.skills as unknown[]).map((s) =>
      typeof s === "string" ? { id: createId(), text: s } : (s as SkillItem)
    );
  }

  // v9: szekció-címek (többnyelvűsíthetőség). Korábbi adatban nincs — az alapértelmezett
  // angol nevekkel pótoljuk, hogy a CV-k ne változzanak meg önkényesen.
  if (!next.sectionTitles || typeof next.sectionTitles !== "object") {
    next.sectionTitles = { ...DEFAULT_SECTION_TITLES };
  } else {
    next.sectionTitles = { ...DEFAULT_SECTION_TITLES, ...next.sectionTitles };
  }

  // v10: kiemelő szín. Korábbi adatban nincs — a CSS-ben eddig beégetett értékkel pótoljuk.
  if (typeof next.accentColor !== "string" || !next.accentColor) {
    next.accentColor = DEFAULT_ACCENT_COLOR;
  }

  // v11: külön alsó margó. Korábbi adatban nincs — a felső margó értékét veszi fel,
  // hogy a meglévő CV-k vizuálisan ne változzanak.
  if (typeof next.marginBottom !== "number") {
    next.marginBottom = typeof next.marginY === "number" ? next.marginY : DEFAULT_MARGIN_BOTTOM_MM;
  }

  next.schemaVersion = CV_SCHEMA_VERSION;
  return next;
}

/** Egyetlen alapértelmezett verziót tartalmazó munkaterület. */
function createDefaultWorkspace(): CvWorkspace {
  const doc: CvDocument = { id: createId(), name: "CV", data: defaultCv };
  return { workspaceVersion: WORKSPACE_VERSION, activeId: doc.id, documents: [doc] };
}

/**
 * Validálja és normalizálja a tárolt munkaterületet: minden verzió adatát
 * felhozza az aktuális sémára, és gondoskodik egy érvényes aktív azonosítóról.
 * Érvénytelen / üres adatnál null-t ad (ekkor fallback történik).
 */
function normalizeWorkspace(value: unknown): CvWorkspace | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Partial<CvWorkspace>;
  if (!Array.isArray(v.documents)) return null;

  const documents: CvDocument[] = v.documents
    .filter((d): d is CvDocument => !!d && isCvLike((d as CvDocument).data))
    .map((d) => ({
      id: typeof d.id === "string" && d.id ? d.id : createId(),
      name: typeof d.name === "string" && d.name.trim() ? d.name : "CV",
      data: migrate(d.data),
    }));

  if (documents.length === 0) return null;

  const activeId =
    typeof v.activeId === "string" && documents.some((d) => d.id === v.activeId)
      ? v.activeId
      : documents[0].id;

  return { workspaceVersion: WORKSPACE_VERSION, activeId, documents };
}

/**
 * A mentett munkaterületet adja vissza. Sorrend:
 * 1. az új, több-verziós tároló,
 * 2. a régi egy-CV-s tároló felhozva egyetlen verzióvá,
 * 3. alapértelmezett munkaterület.
 * Szerveren (window nélkül) mindig a default — hidratációs eltérés nélkül.
 */
function readStoredWorkspace(): CvWorkspace {
  if (typeof window === "undefined") return createDefaultWorkspace();
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    if (raw) {
      const ws = normalizeWorkspace(JSON.parse(raw));
      if (ws) return ws;
    }
    // Régi, egy CV-s formátum felhozása egyetlen verzióvá.
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (isCvLike(parsed)) {
        const doc: CvDocument = { id: createId(), name: "CV", data: migrate(parsed) };
        return { workspaceVersion: WORKSPACE_VERSION, activeId: doc.id, documents: [doc] };
      }
    }
  } catch {
    // Sérült adat — marad a default.
  }
  return createDefaultWorkspace();
}

/** Soron következő alapértelmezett verziónév (Verzió 1, Verzió 2, …). */
function nextVersionName(documents: CvDocument[]): string {
  let n = documents.length + 1;
  const taken = new Set(documents.map((d) => d.name));
  while (taken.has(`Verzió ${n}`)) n++;
  return `Verzió ${n}`;
}

/**
 * A CV-verziók állapotát kezeli localStorage perzisztenciával:
 * - a kezdőérték lazán a tárolóból jön (SSR-en a default, hidratációs eltérés nélkül),
 * - bármely változásnál debounce-olva ír vissza,
 * - a `loaded` jelzi, mikor futott le a kliensoldali mount (a villogás elkerülésére).
 *
 * A `cv` / `setCv` / `resetCv` az ÉPP AKTÍV verzióra hat, így a szerkesztő
 * felülete változatlanul használható; a verziókezelés a többi mezőn keresztül megy.
 */
export function useCvWorkspace() {
  const [workspace, setWorkspace] = useState<CvWorkspace>(readStoredWorkspace);
  const loaded = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce-olt mentés minden változásnál (a mount után).
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
      } catch {
        // Tárhely tele / nem elérhető — csendben elnyeljük.
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [workspace, loaded]);

  const activeDoc =
    workspace.documents.find((d) => d.id === workspace.activeId) ?? workspace.documents[0];

  /** Az aktív verzió adatainak frissítése (érték vagy frissítő függvény). */
  function setCv(updater: CvData | ((prev: CvData) => CvData)) {
    setWorkspace((prev) => ({
      ...prev,
      documents: prev.documents.map((d) =>
        d.id === prev.activeId
          ? {
              ...d,
              data: typeof updater === "function" ? (updater as (p: CvData) => CvData)(d.data) : updater,
            }
          : d
      ),
    }));
  }

  /** Az aktív verzió tartalmának visszaállítása az alapértelmezett (minta) CV-re. */
  function resetCv() {
    setCv(defaultCv);
  }

  /** Verzióváltás. */
  function selectVersion(id: string) {
    setWorkspace((prev) =>
      prev.documents.some((d) => d.id === id) ? { ...prev, activeId: id } : prev
    );
  }

  /**
   * Új verzió létrehozása és aktiválása. Megadott `data` nélkül az
   * alapértelmezett CV-ből indul (pl. új, üres verzió).
   */
  function addVersion(data: CvData = defaultCv, name?: string) {
    setWorkspace((prev) => {
      const doc: CvDocument = {
        id: createId(),
        name: name?.trim() || nextVersionName(prev.documents),
        data,
      };
      return { ...prev, documents: [...prev.documents, doc], activeId: doc.id };
    });
  }

  /** Az aktív verzió másolata új verzióként, aktiválva. */
  function duplicateVersion() {
    setWorkspace((prev) => {
      const src = prev.documents.find((d) => d.id === prev.activeId);
      if (!src) return prev;
      const doc: CvDocument = {
        id: createId(),
        name: `${src.name} másolat`,
        data: { ...src.data },
      };
      return { ...prev, documents: [...prev.documents, doc], activeId: doc.id };
    });
  }

  /** Verzió átnevezése (üres név esetén nincs változás). */
  function renameVersion(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setWorkspace((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === id ? { ...d, name: trimmed } : d)),
    }));
  }

  /**
   * Verzió törlése. Ha az aktívat töröljük, a szomszédjára váltunk.
   * Az utolsó verzió törlésekor egy friss alapértelmezett verzió jön létre,
   * hogy mindig legyen mit szerkeszteni.
   */
  function removeVersion(id: string) {
    setWorkspace((prev) => {
      const idx = prev.documents.findIndex((d) => d.id === id);
      if (idx === -1) return prev;
      const documents = prev.documents.filter((d) => d.id !== id);
      if (documents.length === 0) return createDefaultWorkspace();
      let activeId = prev.activeId;
      if (activeId === id) {
        activeId = (documents[idx] ?? documents[idx - 1] ?? documents[0]).id;
      }
      return { ...prev, documents, activeId };
    });
  }

  return {
    cv: activeDoc.data,
    setCv,
    loaded,
    resetCv,
    // Verziókezelés
    documents: workspace.documents,
    activeId: workspace.activeId,
    selectVersion,
    addVersion,
    duplicateVersion,
    renameVersion,
    removeVersion,
  };
}

export { WORKSPACE_KEY };
