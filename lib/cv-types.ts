// A CV adatmodellje. Minden kliensoldali — localStorage-ban tárolódik.
// A schemaVersion segít, ha később változik a szerkezet (migráció a betöltésnél).

export const CV_SCHEMA_VERSION = 6;

/** A lap alapértelmezett margói milliméterben. */
export const DEFAULT_MARGIN_Y_MM = 18; // felső / alsó
export const DEFAULT_MARGIN_X_MM = 18; // bal / jobb

/** A szekciók tartalmának alapértelmezett behúzása (a vezérvonal és a szöveg közti tér) mm-ben. */
export const DEFAULT_SECTION_INDENT_MM = 4;

/** Egy elérhetőség a fejlécben (pl. e-mail, GitHub). url opcionális — ha van, linkként renderelődik. */
export interface ContactItem {
  id: string;
  text: string;
  url?: string;
  /** Ha igaz, ez az elem új sorban kezdődik a fejlécben. */
  newLine?: boolean;
}

/**
 * A profilkép szerkesztési beállításai (zoom + eltolás), hogy az eredeti képet
 * megőrizve, később ugyanazzal a kivágással újra meg lehessen nyitni a szerkesztőt.
 * Az `offsetX/Y` a szerkesztő nézőablakához viszonyított CSS-pixel eltolás.
 */
export interface PhotoCrop {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Egy időrendi bejegyzés. Ugyanazt a formát használja a Work Experience,
 * a Projects és az Education szekció, hogy a szerkesztő is egységes legyen.
 */
export interface TimelineEntry {
  id: string;
  period: string; // pl. "2024. 08. – PRESENT"
  title: string; // pl. "JUNIOR JAVA BACKEND DEVELOPER"
  organization: string; // pl. "IVY TECHNOLOGY KFT."
  description: string;
}

export interface CvData {
  schemaVersion: number;

  // Lap beállítások (mm)
  marginY: number; // felső / alsó
  marginX: number; // bal / jobb
  /** A szekciók tartalmának behúzása (a pontozott vezérvonal és a szöveg közti tér), mm. */
  sectionIndent: number;

  // Fejléc
  firstName: string;
  lastName: string;
  photoDataUrl: string; // a megjelenített (körbevágott) kép; üres string = helyőrző
  /** A feltöltött eredeti kép — ebből nyílik újra a szerkesztő. Üres = nincs / régi adat. */
  photoOriginalDataUrl?: string;
  /** A legutóbb alkalmazott kivágás beállításai (zoom + eltolás). */
  photoCrop?: PhotoCrop;
  contacts: ContactItem[];

  // Bevezető bekezdés
  summary: string;

  // Szekciók
  experience: TimelineEntry[];
  projects: TimelineEntry[];
  education: TimelineEntry[];

  // Kompetenciák — egyszerű lista, két oszlopban renderelve
  skills: string[];
}

/** Stabil, ütközésmentes id-t ad új bejegyzésekhez (csak kliensen hívandó). */
export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Üres időrendi bejegyzés (a szerkesztő "+ hozzáadás" gombjához). */
export function emptyTimelineEntry(): TimelineEntry {
  return { id: createId(), period: "", title: "", organization: "", description: "" };
}

/** Üres elérhetőség. */
export function emptyContact(): ContactItem {
  return { id: createId(), text: "", url: "" };
}
