"use client";

// Egyszerű kép-szerkesztő modál a profilképhez: nagyítás (zoom) + körbevágás.
// Library nélkül, canvas + pointer eseményekkel. A kimenet a megadott arányú
// (alapból négyzetes) PNG data URL, ami illeszkedik az object-cover előnézethez.

import { useCallback, useEffect, useRef, useState } from "react";
import type { PhotoCrop } from "@/lib/cv-types";

/** A kimeneti kép hosszabbik oldalának mérete pixelben. */
const OUTPUT_BASE = 400;
/** A szerkesztő nézőablakának hosszabbik oldala CSS pixelben. */
const VIEWPORT_BASE = 300;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

type Offset = { x: number; y: number };

export default function PhotoCropper({
  src,
  initialCrop,
  aspect = 1,
  onCancel,
  onConfirm,
}: {
  /** A szerkesztendő kép (eredeti) data URL-je. */
  src: string;
  /** Korábban alkalmazott kivágás — ha van, ezzel nyílik meg a szerkesztő. */
  initialCrop?: PhotoCrop | null;
  /** A kivágás szélesség:magasság aránya (1 = négyzet, <1 = álló). */
  aspect?: number;
  onCancel: () => void;
  /** A körbevágott képet és az alkalmazott kivágás beállításait adja vissza. */
  onConfirm: (result: { dataUrl: string; crop: PhotoCrop }) => void;
}) {
  // A nézőablak és a kimenet mérete az aránytól függ (a hosszabbik oldal fix).
  const VIEW_W = aspect >= 1 ? VIEWPORT_BASE : Math.round(VIEWPORT_BASE * aspect);
  const VIEW_H = aspect >= 1 ? Math.round(VIEWPORT_BASE / aspect) : VIEWPORT_BASE;
  const OUT_W = aspect >= 1 ? OUTPUT_BASE : Math.round(OUTPUT_BASE * aspect);
  const OUT_H = aspect >= 1 ? Math.round(OUTPUT_BASE / aspect) : OUTPUT_BASE;

  // A betöltött kép és natúr méretei — a crop számításához kell.
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  // Húzás állapota (pointer eseményekhez).
  const dragRef = useRef<{ startX: number; startY: number; origin: Offset } | null>(null);

  // ── Alap "cover" skála: a kép teljesen kitölti a nézőablakot ──
  const coverScale = natural ? Math.max(VIEW_W / natural.w, VIEW_H / natural.h) : 1;
  const scale = coverScale * zoom;
  const dispW = natural ? natural.w * scale : 0;
  const dispH = natural ? natural.h * scale : 0;

  // Az eltolást úgy korlátozzuk, hogy a kép mindig kitöltse a nézőablakot.
  const clamp = useCallback(
    (o: Offset): Offset => ({
      x: Math.min(0, Math.max(VIEW_W - dispW, o.x)),
      y: Math.min(0, Math.max(VIEW_H - dispH, o.y)),
    }),
    [dispW, dispH, VIEW_W, VIEW_H],
  );

  // A kép betöltése a natúr méretekért. Ha van korábbi kivágás, azt töltjük be,
  // különben középre igazítunk.
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      imgRef.current = image;
      setNatural({ w: image.naturalWidth, h: image.naturalHeight });
      if (initialCrop) {
        setZoom(initialCrop.zoom);
        setOffset({ x: initialCrop.offsetX, y: initialCrop.offsetY });
      } else {
        const cover = Math.max(VIEW_W / image.naturalWidth, VIEW_H / image.naturalHeight);
        const w = image.naturalWidth * cover;
        const h = image.naturalHeight * cover;
        setOffset({ x: (VIEW_W - w) / 2, y: (VIEW_H - h) / 2 });
      }
    };
    image.src = src;
  }, [src, initialCrop, VIEW_W, VIEW_H]);

  // Zoom közben a nézőablak közepét tartjuk fixen.
  function applyZoom(nextZoom: number) {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    setZoom(z);
    setOffset((prev) => {
      const nextScale = coverScale * z;
      const ratio = nextScale / scale;
      const cx = VIEW_W / 2;
      const cy = VIEW_H / 2;
      const nw = natural ? natural.w * nextScale : 0;
      const nh = natural ? natural.h * nextScale : 0;
      const o = {
        x: cx - (cx - prev.x) * ratio,
        y: cy - (cy - prev.y) * ratio,
      };
      return {
        x: Math.min(0, Math.max(VIEW_W - nw, o.x)),
        y: Math.min(0, Math.max(VIEW_H - nh, o.y)),
      };
    });
  }

  // ── Húzás (egér + érintés egységesen pointer eseményekkel) ──
  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: offset };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    setOffset(
      clamp({
        x: d.origin.x + (e.clientX - d.startX),
        y: d.origin.y + (e.clientY - d.startY),
      }),
    );
  }
  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignoráljuk, ha már nincs capture */
    }
  }
  function onWheel(e: React.WheelEvent) {
    applyZoom(zoom - e.deltaY * 0.002);
  }

  // ESC = mégse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // ── A látható négyzet kivágása canvasra ──
  function handleConfirm() {
    const image = imgRef.current;
    if (!image || !natural) return;

    // A nézőablak (0..VIEW_W × 0..VIEH_H) pixelei a forráskép pixeleire képződnek le.
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sW = VIEW_W / scale;
    const sH = VIEW_H / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, sx, sy, sW, sH, 0, 0, OUT_W, OUT_H);

    // PNG, hogy az átlátszóság / minőség megmaradjon. A kivágás beállításait is
    // visszaadjuk, hogy az eredeti képet megőrizve később újra megnyitható legyen.
    onConfirm({
      dataUrl: canvas.toDataURL("image/png"),
      crop: { zoom, offsetX: offset.x, offsetY: offset.y },
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        // Háttérre kattintás = mégse.
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-4 shadow-2xl">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-700">
          Kép körbevágása
        </h2>

        {/* Nézőablak */}
        <div
          className="relative mx-auto touch-none cursor-grab overflow-hidden rounded-md bg-neutral-900 select-none active:cursor-grabbing"
          style={{ width: VIEW_W, height: VIEW_H }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {natural && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none"
              style={{
                width: dispW,
                height: dispH,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
          {/* Rácssegéd (harmadolás) a kompozícióhoz */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/15" />
            ))}
          </div>
        </div>

        {/* Zoom csúszka */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-neutral-500">Nagyítás</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => applyZoom(Number(e.target.value))}
            className="w-full accent-neutral-900"
          />
        </div>

        <p className="mt-2 text-center text-[11px] text-neutral-400">
          Húzd a képet a pozícionáláshoz, görgővel vagy a csúszkával nagyíts.
        </p>

        {/* Gombok */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
          >
            Mégse
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!natural}
            className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-40"
          >
            Alkalmaz
          </button>
        </div>
      </div>
    </div>
  );
}
