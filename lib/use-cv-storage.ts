"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CV_SCHEMA_VERSION,
  DEFAULT_MARGIN_X_MM,
  DEFAULT_MARGIN_Y_MM,
  DEFAULT_SECTION_INDENT_MM,
  type CvData,
} from "./cv-types";
import { defaultCv } from "./default-cv";

const STORAGE_KEY = "cv-generator:data";
const SAVE_DEBOUNCE_MS = 400;

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
function migrate(cv: CvData): CvData {
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

  next.schemaVersion = CV_SCHEMA_VERSION;
  return next;
}

/** A mentett CV-t adja vissza, vagy a defaultCv-t. Szerveren (window nélkül) mindig a default. */
function readStoredCv(): CvData {
  if (typeof window === "undefined") return defaultCv;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isCvLike(parsed)) return migrate(parsed);
    }
  } catch {
    // Sérült adat — marad a default.
  }
  return defaultCv;
}

/**
 * A CV állapotát kezeli localStorage perzisztenciával:
 * - a kezdőérték lazán a tárolóból jön (SSR-en a default, hidratációs eltérés nélkül),
 * - szerkesztéskor debounce-olva ír vissza,
 * - a `loaded` jelzi, mikor futott le a kliensoldali mount (a tartalom villogásának elkerülésére).
 */
export function useCvStorage() {
  const [cv, setCv] = useState<CvData>(readStoredCv);
  const loaded = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce-olt mentés minden változásnál (a mount után).
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cv));
      } catch {
        // Tárhely tele / nem elérhető — csendben elnyeljük.
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [cv, loaded]);

  /** Visszaállítás a minta szerinti alapértékre. */
  function resetCv() {
    setCv(defaultCv);
  }

  return { cv, setCv, loaded, resetCv };
}

export { STORAGE_KEY };
