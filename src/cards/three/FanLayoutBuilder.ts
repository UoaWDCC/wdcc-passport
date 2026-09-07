import type { SceneDims } from "../types";
import { CARD_SIZE, basePosition } from "./layout";

/** Pose of a card in the fan (position, in-plane tilt, height). */
export interface FanState {
  x: number;
  y: number;
  z: number;
  rotZ: number;
  scale: number;
}

/** pokebox fan: 7 cards over a 36 degree arc. */
export const FAN_COUNT = 7;
export const FAN_TOTAL_ARC_DEG = 36;
export const FAN_ARC_PER_CARD_DEG = FAN_TOTAL_ARC_DEG / (FAN_COUNT - 1);
/** Cards more than this many slots from the centre are not built (the hand is 7 = radius 3, plus fade-out). */
export const FAN_VISIBLE_RADIUS = 4;
/** Staggered intro pop-up, per card (pokebox FanLayoutBuilder). */
export const FAN_INTRO_DELAY = 0.07;
export const FAN_INTRO_DURATION = 0.35;

/** Fan cards are slightly smaller than single mode: cardSize * 0.85. */
export function fanCardHeight(dims: SceneDims): number {
  return dims.screenH * CARD_SIZE * 0.85;
}

function pivot(cardH: number, dims: SceneDims) {
  const base = basePosition(dims);
  const radius = cardH * 3.2;
  // Pivot is below screen centre — cards fan upward
  return { x: base.x, y: base.y - radius + cardH * 0.15, radius, baseZ: base.z - 2 };
}

/**
 * Rest pose on pokebox's poker-hand arc, parameterised by a continuous offset
 * (index - scrollPosition) so scrolling slides every card along the arc. Offset 0
 * is the centre card (index 3 of 7); the z-spread runs left = back wall, right = front.
 */
export function fanRest(
  offset: number,
  cardH: number,
  dims: SceneDims,
): FanState & { visible: boolean } {
  const p = pivot(cardH, dims);
  const angle = (offset * FAN_ARC_PER_CARD_DEG * Math.PI) / 180;
  const half = (FAN_COUNT - 1) / 2;
  const frac = Math.min(1, Math.max(0, (offset + half) / (FAN_COUNT - 1)));
  const abs = Math.abs(offset);
  const fade = abs <= half ? 1 : Math.max(0, FAN_VISIBLE_RADIUS - abs);
  return {
    x: p.x + Math.sin(angle) * p.radius,
    y: p.y + Math.cos(angle) * p.radius,
    z: p.baseZ + frac * dims.boxD * 0.45,
    rotZ: -angle,
    scale: cardH * fade,
    visible: abs < FAN_VISIBLE_RADIUS,
  };
}

/** Hover "peek" pose: slides up, flattens most of its tilt, grows slightly. */
export function fanHover(rest: FanState, cardH: number): FanState {
  return {
    x: rest.x,
    y: rest.y + cardH * 0.18,
    z: rest.z,
    rotZ: rest.rotZ * 0.2,
    scale: rest.scale * 1.08,
  };
}

/** Intro start pose: hidden below the pivot, small, flat. */
export function fanIntro(cardH: number, dims: SceneDims): FanState {
  const p = pivot(cardH, dims);
  return { x: p.x, y: p.y - cardH * 0.5, z: p.baseZ, rotZ: 0, scale: cardH * 0.4 };
}
