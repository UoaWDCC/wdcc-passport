import { PerspectiveCamera } from "three";
import type { SceneDims } from "../types";

/** Physical-ish defaults, in cm (same convention as pokebox's calibration). */
export const SCREEN_H_CM = 24.81;
export const VIEW_DISTANCE_CM = 60;
export const BOX_DEPTH_RATIO = 0.8;
export const NEAR = 5;
export const FAR = 1000;

export function computeDims(viewportW: number, viewportH: number): SceneDims {
  const screenH = SCREEN_H_CM;
  const screenW = screenH * (viewportW / Math.max(1, viewportH));
  return { screenW, screenH, boxD: screenH * BOX_DEPTH_RATIO, eyeZ: VIEW_DISTANCE_CM };
}

/**
 * Off-axis (generalised) perspective: the screen is a fixed window at z = 0 and the
 * eye moves freely in front of it, so the frustum is asymmetric. Same maths as pokebox.
 */
export function updateOffAxisCamera(
  camera: PerspectiveCamera,
  dims: SceneDims,
  ex: number,
  ey: number,
  ez: number,
): void {
  if (ez <= NEAR) return;
  const nOverD = NEAR / ez;
  const left = (-dims.screenW / 2 - ex) * nOverD;
  const right = (dims.screenW / 2 - ex) * nOverD;
  const bottom = (-dims.screenH / 2 - ey) * nOverD;
  const top = (dims.screenH / 2 - ey) * nOverD;

  camera.position.set(ex, ey, ez);
  camera.lookAt(ex, ey, 0);
  camera.projectionMatrix.makePerspective(left, right, top, bottom, NEAR, FAR);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
