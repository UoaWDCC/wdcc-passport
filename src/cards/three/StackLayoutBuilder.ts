import type { SceneDims } from "../types";
import { CARD_ASPECT } from "./buildCard";
import { basePosition, singleCardSize } from "./layout";

export interface StackState {
  x: number;
  y: number;
  z: number;
  scale: number;
}

/** pokebox STACK_COUNT. */
export const STACK_COUNT = 5;
export const STACK_INTRO_DELAY = 0.06;
export const STACK_INTRO_DURATION = 0.45;

/** Enlarge the pile but reserve vertical room for the top card lifting toward the camera on a flip. */
export function stackCardHeight(dims: SceneDims): number {
  return dims.screenH * Math.min(singleCardSize(dims), 0.89);
}

/** Depth gap between pile slots, as a fraction of the box depth (pokebox uses 0.02; wider so a flip clears the pile). */
export const STACK_Z_STEP = 0.06;

/**
 * Pile pose for a slot (0 = top card, centred). Each card below is offset to
 * reveal its edges (pokebox StackLayoutBuilder).
 */
export function stackRest(slot: number, cardH: number, dims: SceneDims): StackState {
  const base = basePosition(dims);
  const cardW = cardH * CARD_ASPECT;
  return {
    x: base.x + slot * cardW * 0.02,
    y: base.y - slot * cardH * 0.015,
    z: base.z - slot * dims.boxD * STACK_Z_STEP,
    scale: cardH * (1 - slot * 0.015),
  };
}

/** Intro start pose: below the screen, small. */
export function stackIntro(cardH: number, dims: SceneDims): StackState {
  const base = basePosition(dims);
  return { x: base.x, y: base.y - cardH * 0.8, z: base.z, scale: cardH * 0.4 };
}

/** Pack reveal intro start pose: the mouth of the torn pack, tiny, so cards are thrown up out of it. */
export function stackBurst(cardH: number, dims: SceneDims): StackState {
  const base = basePosition(dims);
  return { x: base.x, y: base.y - cardH * 0.3, z: base.z, scale: cardH * 0.22 };
}
