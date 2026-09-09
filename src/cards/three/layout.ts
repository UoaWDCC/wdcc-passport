import type { SceneDims } from "../types";
import { CARD_ASPECT } from "./buildCard";
import type { Transform } from "./Tween";

/** pokebox DEFAULT_CONFIG.cardSize — fan/wall card height as a fraction of screen height. */
export const CARD_SIZE = 0.5;
/** pokebox DEFAULT_CARD transform: x/y in % of screen size, z in % of box depth. */
export const DEFAULT_CARD = { x: 0, y: -2, z: 25 };
/** Z (in front of the screen plane) for a zoomed fan card (pokebox ZOOMED_Z_OFFSET). */
export const ZOOMED_Z_OFFSET = 4;

/** pokebox singleCardSize: 85% of screen height, capped so the card is at most 90% of the width. */
export function singleCardSize(dims: SceneDims): number {
  const aspect = dims.screenW / dims.screenH;
  return Math.min(0.85, (aspect / CARD_ASPECT) * 0.9);
}

export function basePosition(dims: SceneDims): { x: number; y: number; z: number } {
  return {
    x: (DEFAULT_CARD.x / 100) * dims.screenW,
    y: (DEFAULT_CARD.y / 100) * dims.screenH,
    z: -(DEFAULT_CARD.z / 100) * dims.boxD,
  };
}

/** Where a zoomed / inspected card is held: base x/y, pulled in front of the screen, single-card size. */
export function zoomedTransform(dims: SceneDims): Transform {
  const b = basePosition(dims);
  return {
    x: b.x,
    y: b.y,
    z: ZOOMED_Z_OFFSET,
    rx: 0,
    ry: 0,
    rz: 0,
    // Single-card size, shrunk by the perspective gain of sitting in front of the
    // screen plane, so it appears exactly as large as the single-mode card.
    scale: dims.screenH * singleCardSize(dims) * ((dims.eyeZ - ZOOMED_Z_OFFSET) / dims.eyeZ),
  };
}

/** Which display mode pokebox picks on startup for the device. */
export function detectMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && !matchMedia("(pointer: fine)").matches)
  );
}
