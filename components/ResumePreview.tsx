"use client";

import { useEffect, useRef, useState } from "react";
import { safeLinkUrl } from "@/lib/safe-url";
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_MARGIN_BOTTOM_MM,
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
  plain,
  children,
}: {
  title: string;
  indent: number;
  plain?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4">
      <h2 className="font-serif text-[17px] font-bold uppercase tracking-wide text-neutral-900">
        {title}
      </h2>
      {plain ? (
        <div className="mt-1">{children}</div>
      ) : (
        <div
          className="mt-1 ml-1 space-y-3 border-l-2 border-dotted border-neutral-300"
          style={{ paddingLeft: `${indent}mm` }}
        >
          {children}
        </div>
      )}
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);

  const marginY = cv.marginY ?? DEFAULT_MARGIN_Y_MM;
  const marginBottom = cv.marginBottom ?? DEFAULT_MARGIN_BOTTOM_MM;
  const marginX = cv.marginX ?? DEFAULT_MARGIN_X_MM;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const article = articleRef.current;
    if (!wrapper || !article) return;

    const check = () => {
      // article.offsetHeight a tényleges tartalommagasság (overflow: visible esetén is helyes).
      // wrapper.clientHeight a böngésző által renderelt 297mm pontos pixelértéke.
      setIsOverflow(article.offsetHeight > wrapper.clientHeight + 0.5);
    };

    check();
    const obs = new ResizeObserver(check);
    obs.observe(article);
    return () => obs.disconnect();
  }, [marginY, marginBottom, marginX]);
  const sectionIndent = cv.sectionIndent ?? DEFAULT_SECTION_INDENT_MM;

  const photoWidth = cv.photoWidth ?? DEFAULT_PHOTO_WIDTH_PX;
  const photoAspect = PHOTO_ASPECT[cv.photoShape ?? "square"];
  const photoHeight = photoWidth / photoAspect;
  const photoOffsetX = cv.photoOffsetX ?? 0;
  const photoSlotHeight = DEFAULT_PHOTO_WIDTH_PX / photoAspect;

  const hiddenSections = new Set(cv.hiddenSections ?? []);
  const titles = { ...DEFAULT_SECTION_TITLES, ...cv.sectionTitles };
  const contacts = cv.contacts.filter((c) => !c.hidden);
  const experience = cv.experience.filter((e) => !e.hidden);
  const projects = cv.projects.filter((e) => !e.hidden);
  const education = cv.education.filter((e) => !e.hidden);
  const skills = cv.skills.filter((s) => !s.hidden);

  const accentColor = cv.accentColor ?? DEFAULT_ACCENT_COLOR;

  return (
    <div className="relative" style={{ width: "210mm" }}>
      {/* A4 vágókeret: képernyőn 297mm magasan klippel, nyomtatásban height: auto */}
      <div ref={wrapperRef} className="cv-page-wrapper">
        <article
          ref={articleRef as React.Ref<HTMLElement>}
          className="cv-page bg-white font-sans text-neutral-800"
          style={{ padding: `${marginY}mm ${marginX}mm ${marginBottom}mm`, "--cv-accent": accentColor } as React.CSSProperties}
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
                      ri === 0 ? "text-neutral-600" : "font-semibold text-[var(--cv-accent)]"
                    }
                  >
                    {row.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && <span className="mx-1.5 text-neutral-400">·</span>}
                        {safeLinkUrl(c.url) ? (
                          <a href={safeLinkUrl(c.url)} className="hover:underline">
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

            <div
              className="relative z-10 shrink-0"
              style={{ width: `${photoWidth}px`, height: `${photoSlotHeight}px` }}
            >
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
            <Section title={titles.competences} indent={sectionIndent} plain>
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

        {/* Vágásvonal-jelzés: piros gradient a lap alján, ha a tartalom túlcsordult */}
        {isOverflow && (
          <div className="screen-only pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-end justify-center bg-gradient-to-t from-red-300/80 to-transparent pb-1.5">
            <span className="rounded bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
              ✂ tartalom levágva
            </span>
          </div>
        )}
      </div>

      {/* Figyelmeztető sáv a lap alatt (csak képernyőn) */}
      {isOverflow && (
        <div className="screen-only mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium leading-snug text-red-700">
          <span className="mt-px shrink-0">⚠</span>
          <span>
            A tartalom túlcsordult az A4-es lapon. Nyomtatáskor ez a rész is megjelenik (második
            oldal). Csökkentsd a szöveget, a margókat, vagy rejtsd el a szekciók egy részét.
          </span>
        </div>
      )}
    </div>
  );
}
