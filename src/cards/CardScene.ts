import { Color, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from "three";
import { PointerTilt } from "./input/PointerTilt";
import {
  CARD_ASPECT,
  buildCardObject,
  disposeCardObject,
  type CardObject,
  type CardTextures,
} from "./three/buildCard";
import { loadTexture } from "./three/textures";
import type { CardImages } from "./types";

export interface CardSceneCallbacks {
  /** Both textures loaded and the card is on screen. */
  onReady(): void;
  /** Loading failed; the scene stays blank. */
  onError(message: string): void;
}

const BACKGROUND = 0x111827;
const CAMERA_FOV = 40;
const CAMERA_DISTANCE = 10;
/** Card height as a fraction of the visible height, capped so it never exceeds 90% of the width. */
const CARD_FILL = 0.85;
const MAX_PIXEL_RATIO = 2;
const FLIP_LERP = 0.08;
/** Pointer travel / duration beyond which a press is no longer a click. */
const CLICK_MAX_PX = 8;
const CLICK_MAX_MS = 500;

/**
 * Renderer, camera and one card. Owns every three.js resource it creates and the
 * listeners it attaches; `dispose()` releases all of them.
 */
export class CardScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly canvas: HTMLCanvasElement;
  private readonly raycaster = new Raycaster();
  private readonly pointerTilt = new PointerTilt();
  private readonly resizeObserver: ResizeObserver;
  private readonly reducedMotion: boolean;

  private textures: CardTextures | null = null;
  private card: CardObject | null = null;
  private flipped = false;
  private flipAngle = 0;

  private pointerDown: { x: number; y: number; t: number } | null = null;
  private raf = 0;
  private lastTime = 0;
  private disposed = false;

  constructor(
    private readonly container: HTMLElement,
    images: CardImages,
    private readonly callbacks: CardSceneCallbacks,
  ) {
    // Throws if a WebGL context cannot be created
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    this.canvas = this.renderer.domElement;
    this.canvas.style.cssText =
      "display:block;width:100%;height:100%;touch-action:none;outline:none";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute("aria-label", "3D card. Press Enter or Space to flip.");
    container.appendChild(this.canvas);

    this.scene.background = new Color(BACKGROUND);
    this.camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    this.camera.position.z = CAMERA_DISTANCE;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.pointerTilt.attach(this.canvas);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerCancel);
    this.canvas.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
    this.onResize();

    void this.load(images);
  }

  dispose(): void {
    this.disposed = true;
    this.stopLoop();
    this.resizeObserver.disconnect();
    this.pointerTilt.detach();
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
    this.canvas.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);

    if (this.card) disposeCardObject(this.card);
    this.card = null;
    this.disposeTextures();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }

  private flip(): void {
    if (!this.card) return;
    this.flipped = !this.flipped;
  }

  private async load(images: CardImages): Promise<void> {
    let textures: CardTextures;
    try {
      const [front, back] = await Promise.all([
        loadTexture(images.front, this.renderer),
        loadTexture(images.back, this.renderer),
      ]);
      textures = { front, back };
    } catch (err) {
      if (!this.disposed) this.callbacks.onError(err instanceof Error ? err.message : String(err));
      return;
    }
    if (this.disposed) {
      textures.front.dispose();
      textures.back.dispose();
      return;
    }
    this.textures = textures;
    this.card = buildCardObject(textures, this.cardHeight());
    this.scene.add(this.card.group);
    this.startLoop();
    this.callbacks.onReady();
  }

  private disposeTextures(): void {
    this.textures?.front.dispose();
    this.textures?.back.dispose();
    this.textures = null;
  }

  /** Visible world height at the card's depth (z = 0). */
  private visibleHeight(): number {
    return 2 * CAMERA_DISTANCE * Math.tan((this.camera.fov * Math.PI) / 360);
  }

  private cardHeight(): number {
    const visH = this.visibleHeight();
    const visW = visH * this.camera.aspect;
    return Math.min(visH * CARD_FILL, (visW * 0.9) / CARD_ASPECT);
  }

  private onResize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.card) this.card.group.scale.setScalar(this.cardHeight());
    if (!this.raf) this.renderer.render(this.scene, this.camera);
  }

  private startLoop(): void {
    if (this.raf || this.disposed) return;
    this.lastTime = performance.now() / 1000;
    this.raf = requestAnimationFrame(this.tick);
  }

  private stopLoop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private readonly tick = (): void => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    const now = performance.now() / 1000;
    const dt = Math.min(now - this.lastTime, 0.1);
    this.lastTime = now;

    this.pointerTilt.update(dt);
    const target = this.flipped ? Math.PI : 0;
    this.flipAngle = this.reducedMotion
      ? target
      : this.flipAngle + (target - this.flipAngle) * FLIP_LERP;

    if (this.card) {
      this.card.group.rotation.set(
        this.pointerTilt.rotateX,
        this.pointerTilt.rotateY + this.flipAngle,
        0,
      );
    }
    this.renderer.render(this.scene, this.camera);
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.stopLoop();
    else if (this.card) this.startLoop();
  };

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.canvas.focus({ preventScroll: true });
    this.pointerDown = { x: e.clientX, y: e.clientY, t: performance.now() };
  };

  private readonly onPointerCancel = (): void => {
    this.pointerDown = null;
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    const down = this.pointerDown;
    this.pointerDown = null;
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    if (moved > CLICK_MAX_PX || performance.now() - down.t > CLICK_MAX_MS) return;
    if (this.hitCard(e)) this.flip();
  };

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.flip();
    }
  };

  private hitCard(e: PointerEvent): boolean {
    if (!this.card) return false;
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    return this.raycaster.intersectObjects([this.card.front, this.card.back], false).length > 0;
  }
}
