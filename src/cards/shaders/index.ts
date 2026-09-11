/**
 * pokebox's holographic card shaders, imported as strings (raw-loader) with their
 * `#include "common/x.glsl"` chunks resolved here, plus the rarity -> style mapping.
 * The .frag/.vert/.glsl files are byte-identical to pokebox's; see SOURCES.md for
 * where they come from and for the three edits applied below at load time.
 */
import blend from "./common/blend.glsl";
import filters from "./common/filters.glsl";
import rainbow from "./common/rainbow.glsl";
import doubleRare from "./double-rare.frag";
import flatsilverReverse from "./flatsilver-reverse.frag";
import holoVert from "./holo.vert";
import illustrationRare from "./illustration-rare.frag";
import ultraRare from "./ultra-rare.frag";
import type { CardRarity } from "../types";

export type ShaderStyle = "flatsilver-reverse" | "ultra-rare" | "illustration-rare" | "double-rare";

const RAW: Record<ShaderStyle, string> = {
  "flatsilver-reverse": flatsilverReverse,
  "ultra-rare": ultraRare,
  "illustration-rare": illustrationRare,
  "double-rare": doubleRare,
};

const CHUNKS: Record<string, string> = {
  "blend.glsl": blend,
  "filters.glsl": filters,
  "rainbow.glsl": rainbow,
};

/**
 * One style per rarity, chosen to match these pokebox MEW 151 reference cards:
 * common = Bulbasaur 001 (reverse holo), rare = Zapdos ex 192 (ultra rare),
 * epic = Poliwhirl 176 (illustration rare), legendary = Ninetales ex 038 (double rare).
 * Deterministic: a card's look depends only on its rarity.
 */
export const RARITY_SHADER: Record<CardRarity, ShaderStyle> = {
  common: "flatsilver-reverse",
  rare: "ultra-rare",
  epic: "illustration-rare",
  legendary: "double-rare",
};

/**
 * Textures the pokebox MEW reference cards have that our art does not. Used when a
 * manifest entry sets no `mask` / `foil`:
 * - common: reverse holos are foil everywhere except the artwork window, so the mask
 *   is the card frame (white) with the art panel cut out (black).
 * - rare: ultra rares are etched, and the shader's sparkle is gated by the etch texture,
 *   so a generic etch relief stands in for the per-card one.
 * - epic: full-card foil; no mask means the whole card (white) is foil.
 * - legendary: full-card foil at 30% strength (uniform 30% grey). At rest, double-rare's
 *   glitter and glare layers darken flat, saturated art by ~20% at full strength, which
 *   reads as foil on pokebox's scans but as a grey veil on ours.
 */
export const RARITY_DEFAULT_TEXTURES: Record<CardRarity, { mask?: string; foil?: string }> = {
  common: { mask: "/cards/masks/reverse-frame.webp" },
  rare: { foil: "/cards/masks/etch-generic.webp" },
  epic: {},
  legendary: { mask: "/cards/masks/legendary-foil.webp" },
};

/** pokebox DEFAULT_CONFIG.holoIntensity. */
export const HOLO_INTENSITY = 0.82;

/** Corner radius as a fraction of the card height (a real card is ~2.5 mm on 88 mm). */
const CORNER_RADIUS = 0.04;

/** Signed distance to a rounded rectangle filling the card, in card-height units. */
const ROUNDED_CORNERS_MAIN = /* glsl */ `
float wdccRoundedRect(vec2 uv) {
  const float ASPECT = 63.0 / 88.0;
  const float RADIUS = ${CORNER_RADIUS.toFixed(3)};
  vec2 p = (uv - 0.5) * vec2(ASPECT, 1.0);
  vec2 q = abs(p) - (vec2(ASPECT, 1.0) * 0.5 - RADIUS);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - RADIUS;
}

void main() {
  wdccCardMain();
  float edge = wdccRoundedRect(vUv);
  float aa = fwidth(edge);
  gl_FragColor.a *= 1.0 - smoothstep(-aa, aa, edge);
  if (gl_FragColor.a < 0.001) discard;
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

/** Fragment source for a style with includes inlined and our three edits applied. */
export function fragmentShader(style: ShaderStyle): string {
  let src = compiled.get(style);
  if (src) return src;
  src = resolveIncludes(RAW[style]);
  // Edit 1 (double-rare only): pokebox draws the *back* image where the mask is black
  // because its double rares are foil over the whole card. Ours can carry a mask, so
  // unmasked areas must show the plain front instead.
  src = src.replace(
    "if (uCardOpacity < 0.01 || mask < 0.01) {\n        vec4 backColor = texture2D(uCardBackTex, uv);\n        gl_FragColor = vec4(backColor.rgb, backColor.a * uFade);",
    "if (uCardOpacity < 0.01 || mask < 0.01) {\n        gl_FragColor = vec4(cardColor.rgb, cardColor.a * uFade);",
  );
  // Edit 2: the back face is seen from behind, so un-mirror the back image horizontally
  // and clip it to the front image's alpha (our fronts have rounded corners, backs don't).
  src = src.replace(
    /vec4 backColor = texture2D\(uCardBackTex, uv\);\s*gl_FragColor = vec4\(backColor\.rgb, backColor\.a \* uFade\);/g,
    "vec4 backColor = texture2D(uCardBackTex, vec2(1.0 - uv.x, uv.y));\n" +
      "        gl_FragColor = vec4(backColor.rgb, backColor.a * cardColor.a * uFade);",
  );
  if (src.includes("texture2D(uCardBackTex, uv)")) {
    // A pokebox update changed the code the edits above look for; fix the patterns.
    throw new Error(`[cards] shader edits did not apply to ${style}`);
  }
  // Edit 3: pokebox's card scans have rounded corners baked into their alpha; ours have
  // almost none, so the original main() is wrapped and its output faded out beyond a
  // rounded rectangle (anti-aliased over one pixel).
  src = src.replace(/void\s+main\s*\(\s*\)/, "void wdccCardMain()") + ROUNDED_CORNERS_MAIN;
  compiled.set(style, src);
  return src;
}

export const vertexShader: string = holoVert;
