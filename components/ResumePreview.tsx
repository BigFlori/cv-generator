import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_MARGIN_X_MM,
  DEFAULT_MARGIN_Y_MM,
  DEFAULT_PHOTO_WIDTH_PX,
  DEFAULT_SECTION_INDENT_MM,
  DEFAULT_SECTION_TITLES,
  PHOTO_ASPECT,
  type ContactItem,
  type CvData,
  type TimelineEntry,
} from "@/lib/cv-types";

// Tisztán megjelenítő komponens: a CV adatból A4 oldalt renderel a minta szerint.
// Nincs benne állapot/hook — szerver- és kliensoldalon is használható.

/** A kapcsolati elemeket sorokra bontja a newLine jelölők mentén. */
function groupContacts(contacts: ContactItem[]): ContactItem[][] {
  const rows: ContactItem[][] = [];
  let current: ContactItem[] = [];
  for (const c of contacts) {
    if (c.newLine && current.length) {
      rows.push(current);
      current = [];
    }
    current.push(c);
  }
  if (current.length) rows.push(current);
  return rows;
}

function Section({
  title,
  indent,
  children,
}: {
  title: string;
  indent: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4">
      <h2 className="font-serif text-[17px] font-bold uppercase tracking-wide text-neutral-900">
        {title}
      </h2>
      {/* Behúzott tartalom függőleges pontozott vezérvonallal (a minta szerint).
          A behúzás mértéke (a vezérvonal és a szöveg közti tér) konfigurálható. */}
      <div
        className="mt-1 ml-1 space-y-3 border-l-2 border-dotted border-neutral-300"
        style={{ paddingLeft: `${indent}mm` }}
      >
        {children}
      </div>
    </section>
  );
}

function Entry({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="break-inside-avoid">
      {entry.period && (
        <p className="text-[12.5px] font-bold uppercase text-neutral-700">{entry.period}</p>
      )}
      {(entry.title || entry.organization) && (
        <p className="text-[14px] font-semibold uppercase">
          <span className="text-[var(--cv-accent)]">
            {entry.title}
            {entry.title && entry.organization ? "," : ""}
          </span>
          {entry.title && entry.organization ? " " : ""}
          <span className="text-neutral-500">{entry.organization}</span>
        </p>
      )}
      {entry.description && (
        <p className="mt-0.5 text-[12.5px] leading-snug text-neutral-600">
          {entry.description}
        </p>
      )}
    </div>
  );
}

export default function ResumePreview({ cv }: { cv: CvData }) {
  const marginY = cv.marginY ?? DEFAULT_MARGIN_Y_MM;
  const marginX = cv.marginX ?? DEFAULT_MARGIN_X_MM;
  const sectionIndent = cv.sectionIndent ?? DEFAULT_SECTION_INDENT_MM;

  // Profilkép elrendezése: szélesség (px), arány (forma) és vízszintes eltolás (mm).
  // A magasságot az arányból számoljuk (aspect = szélesség / magasság).
  const photoWidth = cv.photoWidth ?? DEFAULT_PHOTO_WIDTH_PX;
  const photoAspect = PHOTO_ASPECT[cv.photoShape ?? "square"];
  const photoHeight = photoWidth / photoAspect;
  const photoOffsetX = cv.photoOffsetX ?? 0;
  // A kép alja egy fix vízszintes vonalon marad: a layoutban ekkora ("slot")
  // magasságú helyet foglal (az alapszélességből az adott arányra számolva),
  // a tényleges kép pedig ehhez alulra horgonyozva nő — így méretnöveléskor
  // felfelé lóg ki, az alja nem mozdul, a fejléc magassága stabil marad.
  const photoSlotHeight = DEFAULT_PHOTO_WIDTH_PX / photoAspect;

  // Rejtés: a `hidden` jelzővel ellátott elemek és a rejtett szekciók
  // kimaradnak a renderelt CV-ből (a szerkesztőben továbbra is megvannak).
  const hiddenSections = new Set(cv.hiddenSections ?? []);
  const titles = { ...DEFAULT_SECTION_TITLES, ...cv.sectionTitles };
  const contacts = cv.contacts.filter((c) => !c.hidden);
  const experience = cv.experience.filter((e) => !e.hidden);
  const projects = cv.projects.filter((e) => !e.hidden);
  const education = cv.education.filter((e) => !e.hidden);
  const skills = cv.skills.filter((s) => !s.hidden);

  const accentColor = cv.accentColor ?? DEFAULT_ACCENT_COLOR;

  return (
    <article
      className="cv-page bg-white font-sans text-neutral-800"
      style={{ padding: `${marginY}mm ${marginX}mm`, "--cv-accent": accentColor } as React.CSSProperties}
    >
      {/* Fejléc */}
      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="font-serif text-[39px] leading-none tracking-tight text-neutral-900">
            <span className="font-bold">{cv.firstName}</span>
            <span className="ml-3 font-normal text-neutral-500">{cv.lastName}</span>
          </h1>
          <div className="mt-2 space-y-0.5 text-[12.5px]">
            {groupContacts(contacts).map((row, ri) => (
              <p
                key={ri}
                className={
                  // Az első sor (pl. helyszín · telefon) a bevezető/leírások
                  // törzsszín-árnyalatát kapja (neutral-600); az alatta lévő
                  // sorok kiemelő színnel és félkövéren.
                  ri === 0 ? "text-neutral-600" : "font-semibold text-[var(--cv-accent)]"
                }
              >
                {row.map((c, i) => (
                  <span key={c.id}>
                    {i > 0 && <span className="mx-1.5 text-neutral-400">·</span>}
                    {c.url ? (
                      <a href={c.url} className="hover:underline">
                        {c.text}
                      </a>
                    ) : (
                      <span>{c.text}</span>
                    )}
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>

        {/* Profilkép slot: fix magasságú hely a layoutban (a fejléc magasságát
            stabilan tartja). A tényleges kép alulra horgonyozva nő, így a
            méretnövelés felfelé lóg ki, az alja vízszintesen fix marad. */}
        <div
          className="relative z-10 shrink-0"
          style={{ width: `${photoWidth}px`, height: `${photoSlotHeight}px` }}
        >
          {/* A méret és arány állítható; a translateX szabad vízszintes
              mozgatást ad (a szöveg fölé is csúszhat). */}
          <div
            className="absolute bottom-0 right-0 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-100"
            style={{
              width: `${photoWidth}px`,
              height: `${photoHeight}px`,
              transform: `translateX(${photoOffsetX}mm)`,
            }}
          >
            {cv.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cv.photoDataUrl}
                alt={`${cv.firstName} ${cv.lastName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                fotó
              </div>
            )}
          </div>
        </div>
      </header>

      <hr className="mt-3 border-neutral-300" />

      {/* Bevezető */}
      {!hiddenSections.has("summary") && cv.summary && (
        <p className="mt-3 text-[12.5px] leading-snug text-neutral-600">{cv.summary}</p>
      )}

      {!hiddenSections.has("experience") && (
        <Section title={titles.experience} indent={sectionIndent}>
          {experience.map((e) => (
            <Entry key={e.id} entry={e} />
          ))}
        </Section>
      )}

      {!hiddenSections.has("projects") && (
        <Section title={titles.projects} indent={sectionIndent}>
          {projects.map((e) => (
            <Entry key={e.id} entry={e} />
          ))}
        </Section>
      )}

      {!hiddenSections.has("education") && (
        <Section title={titles.education} indent={sectionIndent}>
          {education.map((e) => (
            <Entry key={e.id} entry={e} />
          ))}
        </Section>
      )}

      {!hiddenSections.has("competences") && (
        <Section title={titles.competences} indent={sectionIndent}>
          <ul className="columns-2 gap-8 text-[12.5px] text-neutral-700">
            {skills.map((s) => (
              <li key={s.id} className="mb-1 flex break-inside-avoid items-start gap-2">
                <span className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--cv-accent)]" />
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </article>
  );
}
