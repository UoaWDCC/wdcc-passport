import {
  DataTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  type Material,
  type Texture,
} from "three";
import { HOLO_INTENSITY, fragmentShader, vertexShader, type ShaderStyle } from "../shaders";
import { SHADER_PRESETS } from "../shaders/presets";
import type { FxTextures } from "./fxTextures";

/** Trading-card aspect ratio (63 mm × 88 mm). */
export const CARD_ASPECT = 63 / 88;

/** Unit-height plane shared by every card; the card height is applied via group.scale. */
const cardGeometry = new PlaneGeometry(CARD_ASPECT, 1);

function solidTexture(r: number, g: number, b: number): DataTexture {
  const t = new DataTexture(new Uint8Array([r, g, b, 255]), 1, 1, RGBAFormat, UnsignedByteType);
  t.needsUpdate = true;
  return t;
}
/** pokebox's blackPixel: stands in for any absent sampler. */
const BLACK_TEXTURE = solidTexture(0, 0, 0);
/** No mask = the whole card is foil (like pokebox's full-art reference cards). */
const WHITE_TEXTURE = solidTexture(255, 255, 255);

export interface CardTextures {
  front: Texture;
  back: Texture;
  mask: Texture | null;
  foil: Texture | null;
}

/**
 * A card is one double-sided plane driven by a pokebox fragment shader (the shader
 * draws the back image on the back face). The group's scale is the card height.
 */
export interface CardObject {
  group: Group;
  mesh: Mesh;
  style: ShaderStyle;
}

let shadersDisabled = false;

/** After a shader compile failure, every card (new or existing) is a plain textured plane. */
export function disableShaders(): void {
  shadersDisabled = true;
}

/** pokebox buildCardMesh: base uniforms + the style's preset uniforms + helper textures. */
function holoMaterial(textures: CardTextures, style: ShaderStyle, fx: FxTextures): ShaderMaterial {
  const uniforms: Record<string, { value: unknown }> = {
    uCardTex: { value: textures.front },
    uCardBackTex: { value: textures.back },
    uMaskTex: { value: textures.mask ?? WHITE_TEXTURE },
    uFoilTex: { value: textures.foil ?? BLACK_TEXTURE },
    uHasFoil: { value: textures.foil ? 1 : 0 },
    uGlitterTex: { value: fx.glitter ?? BLACK_TEXTURE },
    uHasGlitter: { value: fx.glitter ? 1 : 0 },
    uGrainTex: { value: fx.grain ?? BLACK_TEXTURE },
    uHasGrain: { value: fx.grain ? 1 : 0 },
    uIri7Tex: { value: fx.iri7 ?? BLACK_TEXTURE },
    uBirthdayDankTex: { value: fx.birthdayDank ?? BLACK_TEXTURE },
    uBirthdayDank2Tex: { value: fx.birthdayDank2 ?? BLACK_TEXTURE },
    uPointer: { value: new Vector2(0.5, 0.5) },
    uBackground: { value: new Vector2(0.5, 0.5) },
    uPointerFromCenter: { value: 0 },
    uPointerFromLeft: { value: 0.5 },
    uPointerFromTop: { value: 0.5 },
    uCardOpacity: { value: HOLO_INTENSITY },
    uTime: { value: 0 },
    uFade: { value: 1 },
    uRotateX: { value: 0 },
  };
  for (const [name, value] of Object.entries(SHADER_PRESETS[style])) uniforms[name] = { value };

  return new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader: fragmentShader(style),
    side: DoubleSide,
    transparent: true,
  });
}

function plainMaterial(front: Texture): MeshBasicMaterial {
  // A built-in material gets gamma-encoded on output, so this texture must be decoded
  // on sampling (the shader path samples it raw, see three/textures.ts).
  front.colorSpace = SRGBColorSpace;
  front.needsUpdate = true;
  return new MeshBasicMaterial({ map: front, side: DoubleSide, transparent: true });
}

function cardMaterial(textures: CardTextures, style: ShaderStyle, fx: FxTextures): Material {
  return shadersDisabled ? plainMaterial(textures.front) : holoMaterial(textures, style, fx);
}

export function buildCardObject(
  textures: CardTextures,
  height: number,
  style: ShaderStyle,
  fx: FxTextures,
): CardObject {
  const mesh = new Mesh(cardGeometry, cardMaterial(textures, style, fx));
  const group = new Group();
  group.add(mesh);
  group.scale.setScalar(height);
  return { group, mesh, style };
}

/**
 * Re-points an existing card at other images (the caller manages texture ownership).
 * Same style: the samplers are swapped in place. New style: the material is rebuilt.
 */
export function setCardTextures(
  card: CardObject,
  textures: CardTextures,
  style: ShaderStyle,
  fx: FxTextures,
): void {
  const material = card.mesh.material as Material;
  if (style === card.style && material instanceof ShaderMaterial) {
    const u = material.uniforms;
    u.uCardTex.value = textures.front;
    u.uCardBackTex.value = textures.back;
    u.uMaskTex.value = textures.mask ?? WHITE_TEXTURE;
    u.uFoilTex.value = textures.foil ?? BLACK_TEXTURE;
    u.uHasFoil.value = textures.foil ? 1 : 0;
    return;
  }
  material.dispose();
  card.mesh.material = cardMaterial(textures, style, fx);
  card.style = style;
}

/** Shader compile failure: keep the card visible as a plain textured plane. */
export function applyFallbackMaterial(card: CardObject): void {
  const material = card.mesh.material as Material;
  if (!(material instanceof ShaderMaterial)) return;
  const front = material.uniforms.uCardTex.value as Texture;
  material.dispose();
  card.mesh.material = plainMaterial(front);
}

/** Draw order (used to keep a moving card on top of its neighbours). */
export function setCardRenderOrder(card: CardObject, order: number): void {
  card.mesh.renderOrder = order;
}

/** Disposes the materials; the geometry is shared and textures are owned by the caller. */
export function disposeCardObject(card: CardObject): void {
  card.group.removeFromParent();
  (card.mesh.material as Material).dispose();
}
