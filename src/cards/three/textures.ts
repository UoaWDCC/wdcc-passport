import { NoColorSpace, Texture, TextureLoader, WebGLRenderer } from "three";
import type { CardManifestEntry } from "../types";
import type { CardTextures } from "./buildCard";

interface CacheEntry {
  refs: number;
  promise: Promise<CardTextures>;
  textures: CardTextures | null;
}

/**
 * Reference-counted full-resolution texture cache. `acquire` loads (or reuses) the
 * textures for a card; `release` disposes them once nothing references them any more.
 */
export class CardTextureCache {
  private readonly loader = new TextureLoader();
  private readonly cache = new Map<string, CacheEntry>();
  private readonly maxAnisotropy: number;

  constructor(renderer: WebGLRenderer) {
    this.maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  private loadOne(url: string): Promise<Texture> {
    return this.loader.loadAsync(url).then((tex) => {
      // pokebox shaders composite in gamma space and write gl_FragColor directly, so
      // textures must not be decoded to linear on sampling.
      tex.colorSpace = NoColorSpace;
      tex.anisotropy = this.maxAnisotropy;
      return tex;
    });
  }

  acquire(entry: CardManifestEntry): Promise<CardTextures> {
    const existing = this.cache.get(entry.id);
    if (existing) {
      existing.refs++;
      return existing.promise;
    }
    const promise = Promise.all([
      this.loadOne(entry.image),
      entry.mask ? this.loadOne(entry.mask) : Promise.resolve(null),
      entry.back ? this.loadOne(entry.back) : Promise.resolve(null),
    ]).then(([image, mask, back]) => {
      const textures = { image, mask, back };
      const current = this.cache.get(entry.id);
      if (!current || current.promise !== promise || current.refs <= 0) {
        // Released (or re-acquired by a newer load) while still loading — nobody wants these.
        disposeTextures(textures);
      } else {
        current.textures = textures;
      }
      return textures;
    });
    this.cache.set(entry.id, { refs: 1, textures: null, promise });
    return promise;
  }

  release(id: string): void {
    const entry = this.cache.get(id);
    if (!entry) return;
    entry.refs--;
    if (entry.refs > 0) return;
    this.cache.delete(id);
    if (entry.textures) disposeTextures(entry.textures);
  }

  dispose(): void {
    for (const entry of this.cache.values()) {
      entry.refs = 0;
      if (entry.textures) disposeTextures(entry.textures);
    }
    this.cache.clear();
  }
}

function disposeTextures(t: CardTextures): void {
  t.image.dispose();
  t.mask?.dispose();
  t.back?.dispose();
}
