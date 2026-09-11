import type { ModeEnv } from "../modes/Mode";
import type { CardEntry } from "../types";
import type { CardTextures } from "./buildCard";
import type { FxTextures } from "./fxTextures";

/** Everything `buildCardObject` needs for one card. */
export interface LoadedCard {
  textures: CardTextures;
  fx: FxTextures;
}

/** Every texture URL a card references (for warming the cache). */
export function cardTextureUrls(entry: CardEntry): string[] {
  return [entry.front, entry.back, entry.mask, entry.foil].filter((u): u is string => !!u);
}

/**
 * Acquires a card's textures from the cache plus the shared effect textures.
 * Front and back are required; a mask or foil that fails to load is dropped with a
 * warning (the card renders with the shader's default for that texture).
 */
export async function acquireCardTextures(env: ModeEnv, entry: CardEntry): Promise<LoadedCard> {
  const { textures } = env;
  const optional = (url: string | undefined, what: string) =>
    url
      ? textures.acquire(url).catch((err: unknown) => {
          console.warn(`[cards] ${what} for ${entry.id} skipped:`, err);
          return null;
        })
      : Promise.resolve(null);
  const [front, back, mask, foil, fx] = await Promise.all([
    textures.acquire(entry.front),
    textures.acquire(entry.back),
    optional(entry.mask, "mask"),
    optional(entry.foil, "foil"),
    env.fx,
  ]);
  return { textures: { front, back, mask, foil }, fx };
}

/** Releases every texture `acquireCardTextures` took (safe after a failed acquire). */
export function releaseCardTextures(env: ModeEnv, entry: CardEntry): void {
  for (const url of cardTextureUrls(entry)) env.textures.release(url);
}
