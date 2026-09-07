import { NoColorSpace, RepeatWrapping, Texture, TextureLoader, WebGLRenderer } from "three";

/** Helper foil textures the pokebox shaders sample (copied from pokebox public/img). */
export interface FxTextures {
  glitter: Texture;
  noise: Texture;
  grain: Texture;
  iri1: Texture;
  iri2: Texture;
  iri7: Texture;
  iri8: Texture;
  iri9: Texture;
  birthdayDank: Texture;
  birthdayDank2: Texture;
}

const FX_BASE = "/cards/fx/";
const FILES: Record<keyof FxTextures, string> = {
  glitter: "glitter.png",
  noise: "noise-base.webp",
  grain: "grain.webp",
  iri1: "iri-1.webp",
  iri2: "iri-2.webp",
  iri7: "iri-7.webp",
  iri8: "iri-8.webp",
  iri9: "iri-9.webp",
  birthdayDank: "birthday-holo-dank.webp",
  birthdayDank2: "birthday-holo-dank-2.webp",
};

export async function loadFxTextures(renderer: WebGLRenderer): Promise<FxTextures> {
  const loader = new TextureLoader();
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const keys = Object.keys(FILES) as Array<keyof FxTextures>;
  const textures = await Promise.all(
    keys.map(async (key) => {
      const tex = await loader.loadAsync(FX_BASE + FILES[key]);
      tex.colorSpace = NoColorSpace;
      tex.wrapS = tex.wrapT = RepeatWrapping;
      tex.anisotropy = aniso;
      return tex;
    }),
  );
  return Object.fromEntries(keys.map((k, i) => [k, textures[i]])) as unknown as FxTextures;
}

export function disposeFxTextures(fx: FxTextures): void {
  for (const tex of Object.values(fx)) tex.dispose();
}
