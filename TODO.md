# CV Generator — TODO

Személyes projekt: álláshirdetésre szabott CV-k gyors kézi szerkesztése és generálása.

**Stack:** Next.js 16 (App Router) + React 19 + Tailwind v4
**Szerkesztés:** űrlap + élő előnézet · **Tárolás:** localStorage · **PDF:** böngésző nyomtatás (A4)

## 1. fázis — a mag
- [x] Elolvasni a vonatkozó `node_modules/next/dist/docs/` részeket (App Router, kliens komponensek, fontok, `next/image`)
- [x] CV TypeScript adatmodell (`lib/cv-types.ts`): header, summary, experience[], projects[], education[], skills[]
- [x] Seed adat a mintából (`lib/default-cv.ts`) a tényleges tartalommal
- [x] `ResumePreview` komponens: minta layout A4-re, nyomtatásra optimalizálva
- [x] Print CSS: `@page` A4, nyomtatáskor csak az előnézet látszódjon

## 2. fázis — szerkesztés
- [x] `CvEditor` osztott nézet: bal oldali űrlap szekciónként, jobb oldali élő előnézet
- [x] localStorage perzisztencia: betöltés indításkor, debounce-olt mentés szerkesztéskor
- [x] Profilkép kezelése: placeholder a seedben, képcsere data URL-ként

## 3. fázis — álláshirdetésre szabás + export
- [x] JSON Export / Import gombok az álláshirdetésre szabott változatok mentéséhez
- [x] PDF export böngésző nyomtatással (A4 layout) — *vizuális finomhangolás a böngészőben ajánlott*

## Ötletek később
- [ ] Több elnevezett változat kezelése a UI-ból (most: JSON export/import hidalja át)
- [ ] Szekciócímek / akcentszín szerkeszthetővé tétele
- [ ] Előnézet-méretezés finomítása (jelenleg fix `scale(0.78)`)
