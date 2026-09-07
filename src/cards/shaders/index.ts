/**
 * pokebox's GLSL shaders (src/cards/shaders/*.frag, imported as strings via
 * raw-loader) with their `#include "common/x.glsl"` chunks resolved at runtime,
 * plus the rarity -> shader-style sets.
 */
import baseAdjust from "./common/base-adjust.glsl";
import blend from "./common/blend.glsl";
import filters from "./common/filters.glsl";
import holoShine from "./common/holo-shine.glsl";
import rainbow from "./common/rainbow.glsl";
import voronoi from "./common/voronoi.glsl";
import doubleRare from "./double-rare.frag";
import flatsilverReverse from "./flatsilver-reverse.frag";
import holoVert from "./holo.vert";
import illustrationRare from "./illustration-rare.frag";
import masterBall from "./master-ball.frag";
import rainbowRare from "./rainbow-rare.frag";
import regularHolo from "./regular-holo.frag";
import reverseHolo from "./reverse-holo.frag";
import shinyRare from "./shiny-rare.frag";
import specialIllustrationRare from "./special-illustration-rare.frag";
import teraRainbowRare from "./tera-rainbow-rare.frag";
import teraShinyRare from "./tera-shiny-rare.frag";
import ultraRare from "./ultra-rare.frag";
import type { CardRarity } from "../types";

export type ShaderStyle =
  | "regular-holo"
  | "reverse-holo"
  | "flatsilver-reverse"
  | "illustration-rare"
  | "double-rare"
  | "tera-rainbow-rare"
  | "master-ball"
  | "rainbow-rare"
  | "ultra-rare"
  | "special-illustration-rare"
  | "shiny-rare"
  | "tera-shiny-rare";

const RAW: Record<ShaderStyle, string> = {
  "regular-holo": regularHolo,
  "reverse-holo": reverseHolo,
  "flatsilver-reverse": flatsilverReverse,
  "illustration-rare": illustrationRare,
  "double-rare": doubleRare,
  "tera-rainbow-rare": teraRainbowRare,
  "master-ball": masterBall,
  "rainbow-rare": rainbowRare,
  "ultra-rare": ultraRare,
  "special-illustration-rare": specialIllustrationRare,
  "shiny-rare": shinyRare,
  "tera-shiny-rare": teraShinyRare,
};

const CHUNKS: Record<string, string> = {
  "base-adjust.glsl": baseAdjust,
  "blend.glsl": blend,
  "filters.glsl": filters,
  "holo-shine.glsl": holoShine,
  "rainbow.glsl": rainbow,
  "voronoi.glsl": voronoi,
};

/** Each rarity draws from its own set of pokebox styles. */
export const RARITY_SHADERS: Record<CardRarity, ShaderStyle[]> = {
  common: ["reverse-holo", "flatsilver-reverse"],
  rare: ["regular-holo", "illustration-rare"],
  epic: ["double-rare", "tera-rainbow-rare", "master-ball"],
  legendary: [
    "rainbow-rare",
    "ultra-rare",
    "special-illustration-rare",
    "shiny-rare",
    "tera-shiny-rare",
  ],
};

export const RARITIES: CardRarity[] = ["common", "rare", "epic", "legendary"];
export const SHADER_STYLES = Object.keys(RAW) as ShaderStyle[];

export function randomRarity(): CardRarity {
  return RARITIES[Math.floor(Math.random() * RARITIES.length)];
}

export function pickShaderForRarity(rarity: CardRarity): ShaderStyle {
  const set = RARITY_SHADERS[rarity];
  return set[Math.floor(Math.random() * set.length)];
}

/** Rounded corners: pokebox relies on the card scan's alpha; our art is square, so discard outside a rounded rect. */
const ROUNDED_CORNERS = /* glsl */ `
float wdccRoundedRect(vec2 uv) {
  const float ASPECT = 63.0 / 88.0;
  const float CORNER = 0.045;
  vec2 p = (uv - 0.5) * vec2(ASPECT, 1.0);
  vec2 hs = vec2(ASPECT, 1.0) * 0.5 - CORNER;
  vec2 q = abs(p) - hs;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - CORNER;
}
`;

function resolveIncludes(src: string, seen = new Set<string>()): string {
  return src.replace(/#include\s+"([^"]+)"/g, (_m, path: string) => {
    const name = path.split("/").pop() ?? path;
    const chunk = CHUNKS[name];
    if (chunk === undefined) throw new Error(`[cards] unknown shader include: ${path}`);
    if (seen.has(name)) return "";
    seen.add(name);
    return resolveIncludes(chunk, seen);
  });
}

const compiled = new Map<ShaderStyle, string>();

export function fragmentShader(style: ShaderStyle): string {
  let src = compiled.get(style);
  if (src) return src;
  src = resolveIncludes(RAW[style]);
  src = src.replace(
    /void\s+main\s*\(\s*\)\s*\{/,
    `${ROUNDED_CORNERS}\nvoid main() {\n  if (wdccRoundedRect(vUv) > 0.0) discard;`,
  );
  // The back face is seen from behind, so un-mirror the back texture horizontally.
  src = src.replace(
    /texture2D\(uCardBackTex,\s*uv\)/g,
    "texture2D(uCardBackTex, vec2(1.0 - uv.x, uv.y))",
  );
  compiled.set(style, src);
  return src;
}

export const vertexShader: string = holoVert;
