// Importált JSON-ból vagy localStorage-ból érkező, nem megbízható értékek szűrése.

const ALLOWED_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Linkként biztonságosan renderelhető URL-t ad vissza, különben undefined-ot.
 * Csak http(s)/mailto/tel séma engedett — így pl. `javascript:` vagy `data:`
 * link nem kerülhet be egy kívülről kapott CV JSON-ból.
 * Séma nélküli (relatív) érték változatlanul átmegy.
 */
export function safeLinkUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  // A böngésző a URL-ből kiszedi a vezérlőkaraktereket és a szóközöket
  // (pl. "java\tscript:"), ezért a séma vizsgálata előtt mi is így teszünk.
  const normalized = url.replace(/[\u0000- \u007f]/g, "");
  if (!normalized) return undefined;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(normalized);
  if (!scheme) return url.trim();
  return ALLOWED_LINK_PROTOCOLS.has(scheme[0].toLowerCase()) ? url.trim() : undefined;
}

/**
 * Csak beágyazott kép data URL-t enged — külső (pl. követő) URL-t nem, így egy
 * importált CV nem indíthat hálózati kérést. Az <img>-ben megjelenített kép
 * (SVG-t is beleértve) nem futtat szkriptet.
 */
export function isSafeImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

/** Hex színkód (#rgb, #rgba, #rrggbb, #rrggbbaa). */
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value);
}
