/** Matches the `rarity` enum in the database card schema. */
export type CardRarity = "common" | "rare" | "epic" | "legendary";

export interface CardEntry {
  id: string;
  name: string;
  front: string;
  back: string;
  /** Picks the holo shader (see shaders/index.ts RARITY_SHADER). */
  rarity: CardRarity;
  /** Optional greyscale foil mask: white = holo, black = matte. Missing = rarity default. */
  mask?: string;
  /** Optional greyscale etched-foil relief. Missing = rarity default. */
  foil?: string;
}

export type ViewMode = "single" | "fan" | "stack";

/** World dimensions in centimetres (the screen is a window at z = 0, the box extends to z = -boxD). */
export interface SceneDims {
  screenW: number;
  screenH: number;
  boxD: number;
  eyeZ: number;
}
