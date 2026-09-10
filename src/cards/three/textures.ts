import { SRGBColorSpace, TextureLoader, type Texture, type WebGLRenderer } from "three";

interface CacheEntry {
  refs: number;
  promise: Promise<Texture>;
  texture: Texture | null;
}

/**
 * Reference-counted texture cache keyed by URL. `acquire` loads (or reuses) a
 * texture; `release` disposes it once nothing references it any more. A texture
 * that finishes loading after its last release is disposed immediately.
 */
export class TextureCache {
  private readonly loader = new TextureLoader();
  private readonly entries = new Map<string, CacheEntry>();
  private readonly maxAnisotropy: number;

  constructor(renderer: WebGLRenderer) {
    this.maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  acquire(url: string): Promise<Texture> {
    const existing = this.entries.get(url);
    if (existing) {
      existing.refs++;
      return existing.promise;
    }
    const promise: Promise<Texture> = this.loader.loadAsync(url).then(
      (texture) => {
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = this.maxAnisotropy;
        const current = this.entries.get(url);
        if (current?.promise !== promise) {
          texture.dispose();
        } else {
          current.texture = texture;
        }
        return texture;
      },
      () => {
        if (this.entries.get(url)?.promise === promise) this.entries.delete(url);
        throw new Error(`Could not load image ${url}`);
      },
    );
    this.entries.set(url, { refs: 1, texture: null, promise });
    return promise;
  }

  release(url: string): void {
    const entry = this.entries.get(url);
    if (!entry) return;
    entry.refs--;
    if (entry.refs > 0) return;
    this.entries.delete(url);
    entry.texture?.dispose();
  }

  dispose(): void {
    for (const entry of this.entries.values()) entry.texture?.dispose();
    this.entries.clear();
  }
}
