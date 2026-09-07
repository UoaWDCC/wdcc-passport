import type { ShaderStyle } from "./shaders";

/** Matches the `rarity` enum in the database card schema. */
export type CardRarity = "common" | "rare" | "epic" | "legendary";

/** One entry of /public/cards/manifest.json (paths resolved to URLs by loadManifest). */
export interface CardManifestEntry {
  id: string;
  name: string;
  /** 63:88 PNG/JPG/WebP front image. */
  image: string;
  /** Optional greyscale mask: white = foil, black = matte. Missing = whole card is foil. */
  mask?: string;
  /** Optional card back image. Missing = flat dark back. */
  back?: string;
  /** Card type; random when the manifest does not set one. */
  rarity: CardRarity;
  /** pokebox shader style, picked at random from the rarity's set (or forced via `shader` in the manifest). */
  shader: ShaderStyle;
}

export type ViewMode = "fan" | "stack" | "single";

/** World dimensions in centimetres (the screen is a window at z = 0, the box extends to z = -boxD). */
export interface SceneDims {
  screenW: number;
  screenH: number;
  boxD: number;
  eyeZ: number;
}

export interface SceneState {
  mode: ViewMode;
  /** A fan card is zoomed. */
  inspecting: boolean;
  /** Name of the card currently in focus (zoomed / top of stack / single). */
  focusedName: string | null;
  cardCount: number;
  isMobile: boolean;
}
