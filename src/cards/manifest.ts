import {
  RARITIES,
  SHADER_STYLES,
  pickShaderForRarity,
  randomRarity,
  type ShaderStyle,
} from "./shaders";
import type { CardManifestEntry, CardRarity } from "./types";

const BASE = "/cards/";

/** Bare filenames are resolved relative to /public/cards; absolute paths and URLs pass through. */
function resolvePath(p: string): string {
  if (p.startsWith("/") || /^https?:\/\//.test(p)) return p;
  return BASE + p;
}

/**
 * Fetch and validate /cards/manifest.json. Cards without a `rarity` get a random
 * one, and every card gets a random shader style from its rarity's set (unless the
 * manifest pins a `shader`).
 */
export async function loadManifest(): Promise<CardManifestEntry[]> {
  const res = await fetch(BASE + "manifest.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`manifest.json: HTTP ${res.status}`);
  const raw: unknown = await res.json();
  if (!Array.isArray(raw)) throw new Error("manifest.json must be an array");

  const entries: CardManifestEntry[] = [];
  raw.forEach((item, i) => {
    if (!item || typeof item !== "object") return;
    const o = item as Record<string, unknown>;
    if (typeof o.image !== "string") {
      console.warn(`[cards] manifest entry ${i} has no image, skipped`);
      return;
    }
    const rarity = RARITIES.includes(o.rarity as CardRarity)
      ? (o.rarity as CardRarity)
      : randomRarity();
    const shader = SHADER_STYLES.includes(o.shader as ShaderStyle)
      ? (o.shader as ShaderStyle)
      : pickShaderForRarity(rarity);
    entries.push({
      id: typeof o.id === "string" ? o.id : `card-${i}`,
      name: typeof o.name === "string" ? o.name : `Card ${i + 1}`,
      image: resolvePath(o.image),
      mask: typeof o.mask === "string" ? resolvePath(o.mask) : undefined,
      back: typeof o.back === "string" ? resolvePath(o.back) : undefined,
      rarity,
      shader,
    });
  });
  return entries;
}
