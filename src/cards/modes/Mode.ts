import type { Raycaster, Scene } from "three";
import type { CardObject } from "../three/buildCard";
import type { FxTextures } from "../three/fxTextures";
import type { TextureCache } from "../three/textures";
import type { SceneDims } from "../types";

/** Shared scene resources a mode may use. Owned by CardScene. */
export interface ModeEnv {
  scene: Scene;
  textures: TextureCache;
  /** Shared holo helper textures, loaded once (never rejects). */
  fx: Promise<FxTextures>;
  reducedMotion: boolean;
}

export interface TickContext {
  /** Seconds. */
  now: number;
  dt: number;
  /** Visible world size at the card plane (z = 0). */
  view: { width: number; height: number };
  /** The same, in pokebox's centimetre convention plus box depth. */
  dims: SceneDims;
  /** Height of a card shown on its own at this view size. */
  singleHeight: number;
  tilt: { rotateX: number; rotateY: number };
  /** Current flip angle (rad) for whichever card is in focus. */
  flipAngle: number;
}

export interface PointerInfo {
  x: number;
  y: number;
  /** Seconds. */
  t: number;
  /** Already aimed from the camera through the pointer. */
  ray: Raycaster;
  canvasWidth: number;
}

/**
 * A display mode owns its cards, layout, animation state and input handling.
 * Input methods return "flip" when the scene should toggle the focused card's
 * flip state, which the scene keeps because it is shared across modes.
 */
export interface Mode {
  tick(ctx: TickContext): void;
  /** Every card currently built (the scene pushes the holo uniforms to them). */
  cards(): Iterable<CardObject>;
  /** A settled card is in focus and may be flipped. */
  canFlip(): boolean;
  pointerDown(p: PointerInfo): void;
  /** Returns whether a card is hovered (for the cursor). */
  pointerMove(p: PointerInfo): boolean;
  pointerUp(p: PointerInfo): "flip" | null;
  pointerCancel(p: PointerInfo): void;
  /** The pointer left the canvas. */
  pointerLeave(): void;
  /** Wheel travel in pixels along the dominant axis. */
  wheel(deltaPx: number): void;
  /** Returns "flip", "handled" or null for an unhandled key. */
  key(key: string): "flip" | "handled" | null;
  dispose(): void;
}
