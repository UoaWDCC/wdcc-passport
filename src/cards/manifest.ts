import { RARITY_DEFAULT_TEXTURES } from "./shaders";
import type { CardEntry, CardRarity } from "./types";

const RARITIES: readonly CardRarity[] = ["common", "rare", "epic", "legendary"];

type RawEntry = Omit<CardEntry, "rarity"> & { rarity?: unknown };

export async function loadManifest(url: string): Promise<CardEntry[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Manifest request failed (${res.status})`);
  const raw = (await res.json()) as RawEntry[];
  return raw.map(normalizeEntry);
}

/** Fills in the rarity (unknown -> common) and the rarity's default mask / foil textures. */
export function normalizeEntry(entry: RawEntry): CardEntry {
  let rarity = entry.rarity as CardRarity;
  if (!RARITIES.includes(rarity)) {
    console.warn(`[cards] ${entry.id}: unknown rarity ${String(entry.rarity)}, using common`);
    rarity = "common";
  }
  const defaults = RARITY_DEFAULT_TEXTURES[rarity];
  return {
    ...entry,
    rarity,
    mask: entry.mask ?? defaults.mask,
    foil: entry.foil ?? defaults.foil,
  };
}
