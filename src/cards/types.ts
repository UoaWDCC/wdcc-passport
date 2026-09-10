export interface CardEntry {
  id: string;
  name: string;
  front: string;
  back: string;
}

export type ViewMode = "single" | "fan" | "stack";

/** World dimensions in centimetres (the screen is a window at z = 0, the box extends to z = -boxD). */
export interface SceneDims {
  screenW: number;
  screenH: number;
  boxD: number;
  eyeZ: number;
}
