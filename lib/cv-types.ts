// A CV adatmodellje. Minden kliensoldali — localStorage-ban tárolódik.
// A schemaVersion segít, ha később változik a szerkezet (migráció a betöltésnél).

export const CV_SCHEMA_VERSION = 11;

/** A renderelt CV elrejthető szekciói. */
export type SectionKey =
  | "summary"
  | "experience"
  | "projects"
  | "education"
  | "competences";

/** Az alapértelmezett kiemelő szín. */
export const DEFAULT_ACCENT_COLOR = "#8a2b22";

/** Előre definiált, ehhez a CV-stílushoz illő kiemelő színek. */
export const ACCENT_PALETTE: { label: string; color: string }[] = [
  { label: "Burgundi",    color: "#8a2b22" },
  { label: "Tengerészkék", color: "#1d3557" },
  { label: "Erdőzöld",   color: "#2e604a" },
  { label: "Indigó",     color: "#4c4baf" },
  { label: "Borostyán",  color: "#b45309" },
  { label: "Palakék",    color: "#374151" },
  { label: "Rozsdabarna", color: "#7c3a1e" },
  { label: "Szilvakék",  color: "#5b2d6e" },
];

/** A lap alapértelmezett margói milliméterben. */
export const DEFAULT_MARGIN_Y_MM = 15; // felső
export const DEFAULT_MARGIN_BOTTOM_MM = 15; // alsó
export const DEFAULT_MARGIN_X_MM = 20; // bal / jobb

/** A szekciók tartalmának alapértelmezett behúzása (a vezérvonal és a szöveg közti tér) mm-ben. */
export const DEFAULT_SECTION_INDENT_MM = 8;

/** A profilkép lehetséges arányai. A `square` 1:1, a `portrait` álló (4:5). */
export type PhotoShape = "square" | "portrait";

/** A profilkép szélesség:magasság aránya formánként (a kivágáshoz és a rendereléshez). */
export const PHOTO_ASPECT: Record<PhotoShape, number> = {
  square: 1,
  portrait: 4 / 5,
};

/** A profilkép alapértelmezett szélessége a renderelt lapon, pixelben. */
export const DEFAULT_PHOTO_WIDTH_PX = 102;
/** A méret-csúszka tartománya pixelben. */
export const MIN_PHOTO_WIDTH_PX = 60;
export const MAX_PHOTO_WIDTH_PX = 200;
/** A vízszintes eltolás tartománya mm-ben (negatív = balra a szöveg felé, pozitív = jobbra a lapszél felé). */
export const MIN_PHOTO_OFFSET_X_MM = -40;
export const MAX_PHOTO_OFFSET_X_MM = 20;

/** Egy elérhetőség a fejlécben (pl. e-mail, GitHub). url opcionális — ha van, linkként renderelődik. */
export interface ContactItem {
  id: string;
  text: string;
  url?: string;
  /** Ha igaz, ez az elem új sorban kezdődik a fejlécben. */
  newLine?: boolean;
  /** Ha igaz, az elem a szerkesztőben megmarad, de a renderelt CV-ből kimarad. */
  hidden?: boolean;
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
  /** Ha igaz, a bejegyzés a szerkesztőben megmarad, de a renderelt CV-ből kimarad. */
  hidden?: boolean;
}

/** Egy kompetencia-elem. Objektum (nem sima string), hogy elemenként elrejthető legyen. */
export interface SkillItem {
  id: string;
  text: string;
  /** Ha igaz, az elem a szerkesztőben megmarad, de a renderelt CV-ből kimarad. */
  hidden?: boolean;
}

export interface CvData {
  schemaVersion: number;

  // Lap beállítások (mm)
  marginY: number; // felső
  marginBottom?: number; // alsó (hiányában marginY értéke)
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
  /** A kép aránya a lapon. Hiányában `square`. */
  photoShape?: PhotoShape;
  /** A kép szélessége a renderelt lapon, pixelben. Hiányában {@link DEFAULT_PHOTO_WIDTH_PX}. */
  photoWidth?: number;
  /** A kép vízszintes eltolása mm-ben (a fejléc jobb oldali helyétől). Hiányában 0. */
  photoOffsetX?: number;
  contacts: ContactItem[];

  // Bevezető bekezdés
  summary: string;

  // Szekciók
  experience: TimelineEntry[];
  projects: TimelineEntry[];
  education: TimelineEntry[];

  // Kompetenciák — lista, két oszlopban renderelve
  skills: SkillItem[];

  /** A renderelt CV-ből teljesen elrejtett szekciók. Hiányában minden látszik. */
  hiddenSections?: SectionKey[];

  /** A 4 szekció egyedi megjelenő neve. Hiányában az angol alapértelmezés érvényes. */
  sectionTitles?: SectionTitles;

  /** A CV kiemelő színe (hex). Hiányában {@link DEFAULT_ACCENT_COLOR}. */
  accentColor?: string;
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

/** A 4 szekció megjelenő címe (többnyelvűsíthetőség). */
export interface SectionTitles {
  experience: string;
  projects: string;
  education: string;
  competences: string;
}

/** Alapértelmezett (angol) szekció-címek. */
export const DEFAULT_SECTION_TITLES: SectionTitles = {
  experience: "Work Experience",
  projects: "Projects",
  education: "Education",
  competences: "Competences",
};

/** Üres elérhetőség. */
export function emptyContact(): ContactItem {
  return { id: createId(), text: "", url: "" };
}

/** Üres kompetencia-elem. */
export function emptySkill(): SkillItem {
  return { id: createId(), text: "" };
}
