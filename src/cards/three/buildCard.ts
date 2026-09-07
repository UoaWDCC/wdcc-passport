import {
  DataTexture,
  DoubleSide,
  Group,
  Mesh,
  PlaneGeometry,
  RGBAFormat,
  ShaderMaterial,
  Texture,
  UnsignedByteType,
  Vector2,
} from "three";
import { fragmentShader, vertexShader, type ShaderStyle } from "../shaders";
import { SHADER_PRESETS } from "../shaders/presets";
import type { FxTextures } from "./fxTextures";

export const CARD_ASPECT = 63 / 88;

/** Unit-height plane shared by every card; card size is applied via group.scale. */
const cardGeometry = new PlaneGeometry(CARD_ASPECT, 1);

function solidTexture(r: number, g: number, b: number): DataTexture {
  const t = new DataTexture(new Uint8Array([r, g, b, 255]), 1, 1, RGBAFormat, UnsignedByteType);
  t.needsUpdate = true;
  return t;
}
/** White mask = whole card is foil. */
export const WHITE_TEXTURE = solidTexture(255, 255, 255);
/** pokebox's blackPixel placeholder for unused samplers. */
export const BLACK_TEXTURE = solidTexture(0, 0, 0);
/** Fallback back face when a card has no `back`. */
export const DEFAULT_BACK_TEXTURE = solidTexture(28, 32, 52);

export interface CardTextures {
  image: Texture;
  mask: Texture | null;
  back: Texture | null;
}

/**
 * A card is one double-sided plane driven by a pokebox fragment shader (the shader
 * draws the back texture on the back face). The group's scale is the card height.
 */
export interface CardObject {
  group: Group;
  mesh: Mesh;
  material: ShaderMaterial;
  style: ShaderStyle;
}

/** pokebox buildCardMesh: base uniforms + style preset uniforms + helper textures. */
export function buildCardObject(
  height: number,
  textures: CardTextures,
  style: ShaderStyle,
  intensity: number,
  fx: FxTextures,
): CardObject {
  const uniforms: Record<string, { value: unknown }> = {
    uCardTex: { value: textures.image },
    uCardBackTex: { value: textures.back ?? DEFAULT_BACK_TEXTURE },
    uMaskTex: { value: textures.mask ?? WHITE_TEXTURE },
    uFoilTex: { value: BLACK_TEXTURE },
    uHasFoil: { value: 0 },
    uGlitterTex: { value: fx.glitter },
    uHasGlitter: { value: 1 },
    uNoiseTex: { value: fx.noise },
    uHasNoise: { value: 1 },
    uGrainTex: { value: fx.grain },
    uHasGrain: { value: 1 },
    uIri1Tex: { value: fx.iri1 },
    uIri2Tex: { value: fx.iri2 },
    uIri7Tex: { value: fx.iri7 },
    uIri8Tex: { value: fx.iri8 },
    uIri9Tex: { value: fx.iri9 },
    uHasIri7: { value: 1 },
    uHasIri8: { value: 1 },
    uHasIri9: { value: 1 },
    uBirthdayDankTex: { value: fx.birthdayDank },
    uBirthdayDank2Tex: { value: fx.birthdayDank2 },
    uPointer: { value: new Vector2(0.5, 0.5) },
    uBackground: { value: new Vector2(0.5, 0.5) },
    uPointerFromCenter: { value: 0 },
    uPointerFromLeft: { value: 0.5 },
    uPointerFromTop: { value: 0.5 },
    uCardOpacity: { value: intensity },
    uTime: { value: 0 },
    uFade: { value: 1 },
    uRotateX: { value: 0 },
  };
  for (const [name, value] of Object.entries(SHADER_PRESETS[style] ?? {}))
    uniforms[name] = { value };

  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: fragmentShader(style),
    side: DoubleSide,
    transparent: true,
  });
  const mesh = new Mesh(cardGeometry, material);
  const group = new Group();
  group.add(mesh);
  group.scale.setScalar(height);
  return { group, mesh, material, style };
}

/**
 * pokebox ShaderUniformUpdater: the "pointer" is where the viewer sits over the
 * card in uv space. Here it comes from the tilt (-1..1 on both axes).
 */
export function setCardTilt(card: CardObject, tiltX: number, tiltY: number): void {
  const u = card.material.uniforms;
  const px = 0.5 + tiltX * 0.5;
  const py = 0.5 + tiltY * 0.5;
  (u.uPointer.value as Vector2).set(px, py);
  (u.uBackground.value as Vector2).set(0.37 + px * 0.26, 0.37 + py * 0.26);
  u.uPointerFromCenter.value = Math.min(Math.hypot(px - 0.5, py - 0.5) * 2, 1);
  u.uPointerFromLeft.value = px;
  u.uPointerFromTop.value = py;
  u.uRotateX.value = card.group.rotation.y * (180 / Math.PI);
}

export function setCardTime(card: CardObject, time: number): void {
  card.material.uniforms.uTime.value = time;
}

/** Overall opacity (single-mode depart/arrive transitions). */
export function setCardFade(card: CardObject, fade: number): void {
  card.material.uniforms.uFade.value = fade;
}

/** Draw order (used to keep a moving card on top of its neighbours). */
export function setCardRenderOrder(card: CardObject, order: number): void {
  card.mesh.renderOrder = order;
}

/** Disposes the material only; textures are owned by the caches. */
export function disposeCardObject(card: CardObject): void {
  card.group.removeFromParent();
  card.material.dispose();
}
