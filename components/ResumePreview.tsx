import {
  DEFAULT_MARGIN_X_MM,
  DEFAULT_MARGIN_Y_MM,
  DEFAULT_SECTION_INDENT_MM,
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
        <p className="text-[12.5px] font-bold text-neutral-700">{entry.period}</p>
      )}
      {(entry.title || entry.organization) && (
        <p className="text-[14px] font-semibold">
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
  return (
    <article
      className="cv-page bg-white font-sans text-neutral-800"
      style={{ padding: `${marginY}mm ${marginX}mm` }}
    >
      {/* Fejléc */}
      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="font-serif text-[39px] leading-none tracking-tight text-neutral-900">
            <span className="font-bold">{cv.firstName}</span>
            <span className="ml-3 font-normal text-neutral-500">{cv.lastName}</span>
          </h1>
          <div className="mt-2 space-y-0.5 text-[12.5px] text-[var(--cv-accent)]">
            {groupContacts(cv.contacts).map((row, ri) => (
              <p key={ri}>
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

        {/* Profilkép vagy helyőrző */}
        <div className="h-[102px] w-[102px] shrink-0 overflow-hidden rounded-sm border border-neutral-200 bg-neutral-100">
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
      </header>

      <hr className="mt-3 border-neutral-300" />

      {/* Bevezető */}
      {cv.summary && (
        <p className="mt-3 text-[12.5px] leading-snug text-neutral-600">{cv.summary}</p>
      )}

      <Section title="Work Experience" indent={sectionIndent}>
        {cv.experience.map((e) => (
          <Entry key={e.id} entry={e} />
        ))}
      </Section>

      <Section title="Projects" indent={sectionIndent}>
        {cv.projects.map((e) => (
          <Entry key={e.id} entry={e} />
        ))}
      </Section>

      <Section title="Education" indent={sectionIndent}>
        {cv.education.map((e) => (
          <Entry key={e.id} entry={e} />
        ))}
      </Section>

      <Section title="Competences" indent={sectionIndent}>
        <ul className="columns-2 gap-8 text-[12.5px] text-neutral-700">
          {cv.skills.map((s, i) => (
            <li key={i} className="mb-1 flex break-inside-avoid items-start gap-2">
              <span className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--cv-accent)]" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
