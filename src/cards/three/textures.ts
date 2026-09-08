import { SRGBColorSpace, TextureLoader, type Texture, type WebGLRenderer } from "three";

const loader = new TextureLoader();

/** Loads one image as a colour texture. Rejects with a readable Error naming the URL. */
export async function loadTexture(url: string, renderer: WebGLRenderer): Promise<Texture> {
  let texture: Texture;
  try {
    texture = await loader.loadAsync(url);
  } catch {
    throw new Error(`Could not load image ${url}`);
  }
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}
