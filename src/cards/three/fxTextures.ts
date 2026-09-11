import { RepeatWrapping, TextureLoader, type Texture, type WebGLRenderer } from "three";

/**
 * Helper foil textures the pokebox shaders sample (copied from pokebox public/img,
 * see shaders/SOURCES.md). Shared by every card; `null` when a file failed to load,
 * in which case the shader gets a black pixel and the matching `uHas*` flag is 0.
 */
export interface FxTextures {
  /** illustration-rare */
  glitter: Texture | null;
  /** flatsilver-reverse */
  grain: Texture | null;
  /** ultra-rare */
  iri7: Texture | null;
  /** double-rare */
  birthdayDank: Texture | null;
  birthdayDank2: Texture | null;
}

const FX_BASE = "/cards/fx/";
const FILES: Record<keyof FxTextures, { file: string; repeat: boolean }> = {
  glitter: { file: "glitter.png", repeat: true },
  grain: { file: "grain.webp", repeat: true },
  iri7: { file: "iri-7.webp", repeat: false },
  birthdayDank: { file: "birthday-holo-dank.webp", repeat: false },
  birthdayDank2: { file: "birthday-holo-dank-2.webp", repeat: false },
};

/** Loads every helper texture once. Never rejects: a missing file just becomes `null`. */
export async function loadFxTextures(renderer: WebGLRenderer): Promise<FxTextures> {
  const loader = new TextureLoader();
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  const keys = Object.keys(FILES) as Array<keyof FxTextures>;
  const loaded = await Promise.all(
    keys.map(async (key) => {
      const { file, repeat } = FILES[key];
      try {
        const tex = await loader.loadAsync(FX_BASE + file);
        // pokebox leaves these in the default (no) colour space and tiles the grain/glitter.
        if (repeat) tex.wrapS = tex.wrapT = RepeatWrapping;
        tex.anisotropy = anisotropy;
        return tex;
      } catch (err) {
        console.warn(`[cards] effect texture ${file} skipped:`, err);
        return null;
      }
    }),
  );
  return Object.fromEntries(keys.map((k, i) => [k, loaded[i]])) as unknown as FxTextures;
}

export function disposeFxTextures(fx: FxTextures): void {
  for (const tex of Object.values(fx)) tex?.dispose();
}
