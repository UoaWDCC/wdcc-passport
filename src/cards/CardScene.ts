import { Color, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from "three";
import { PointerTilt } from "./input/PointerTilt";
import {
  CARD_ASPECT,
  buildCardObject,
  disposeCardObject,
  type CardObject,
} from "./three/buildCard";
import { TextureCache } from "./three/textures";
import type { CardEntry } from "./types";

export type CardStatus =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

export interface CardSceneCallbacks {
  onStatus(status: CardStatus): void;
  onStep(delta: number): void;
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
/** Horizontal pointer travel that counts as a swipe (must also beat vertical travel). */
const SWIPE_MIN_PX = 50;
const SWIPE_MAX_MS = 500;

/**
 * Renderer, camera and one card at a time. `show` swaps in a card; textures come
 * from a shared reference-counted cache. Owns every three.js resource it creates
 * and the listeners it attaches; `dispose()` releases all of them.
 */
export class CardScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly canvas: HTMLCanvasElement;
  private readonly raycaster = new Raycaster();
  private readonly pointerTilt = new PointerTilt();
  private readonly textures: TextureCache;
  private readonly resizeObserver: ResizeObserver;
  private readonly reducedMotion: boolean;

  /** Bumped on every `show` so a load that finishes late is discarded. */
  private generation = 0;
  private card: CardObject | null = null;
  private cardUrls: { front: string; back: string } | null = null;
  /** Texture URLs kept loaded by `preload`. */
  private warm = new Set<string>();
  private flipped = false;
  private flipAngle = 0;

  private pointerDown: { x: number; y: number; t: number } | null = null;
  private raf = 0;
  private lastTime = 0;
  private disposed = false;

  constructor(
    private readonly container: HTMLElement,
    private readonly callbacks: CardSceneCallbacks,
  ) {
    // Throws if a WebGL context cannot be created
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    this.canvas = this.renderer.domElement;
    this.canvas.style.cssText =
      "display:block;width:100%;height:100%;touch-action:none;outline:none";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute(
      "aria-label",
      "3D card. Press Enter or Space to flip, left and right arrows to change card.",
    );
    container.appendChild(this.canvas);

    this.scene.background = new Color(BACKGROUND);
    this.camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    this.camera.position.z = CAMERA_DISTANCE;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.textures = new TextureCache(this.renderer);

    this.pointerTilt.attach(this.canvas);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerCancel);
    window.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
    this.onResize();
  }

  dispose(): void {
    this.disposed = true;
    this.generation++;
    this.stopLoop();
    this.resizeObserver.disconnect();
    this.pointerTilt.detach();
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
    window.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);

    this.clearCard();
    this.textures.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }

  /** Replaces the current card. A previous `show` still loading is discarded. */
  async show(entry: CardEntry): Promise<void> {
    const gen = ++this.generation;
    this.clearCard();
    this.emit({ kind: "loading" });

    const urls = { front: entry.front, back: entry.back };
    let front, back;
    try {
      [front, back] = await Promise.all([
        this.textures.acquire(urls.front),
        this.textures.acquire(urls.back),
      ]);
    } catch (err) {
      this.textures.release(urls.front);
      this.textures.release(urls.back);
      if (gen === this.generation) {
        this.emit({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      }
      return;
    }
    if (gen !== this.generation) {
      // Another card was requested (or the scene was disposed) while loading.
      this.textures.release(urls.front);
      this.textures.release(urls.back);
      return;
    }
    this.cardUrls = urls;
    this.card = buildCardObject({ front, back }, this.cardHeight());
    this.scene.add(this.card.group);
    this.startLoop();
    this.emit({ kind: "ready" });
  }

  /**
   * Keeps the textures of these cards loaded so a later `show` of any of them is
   * instant. Cards dropped from the list since the previous call are released.
   */
  preload(entries: readonly CardEntry[]): void {
    const wanted = new Set(entries.flatMap((e) => [e.front, e.back]));
    for (const url of this.warm) if (!wanted.has(url)) this.textures.release(url);
    for (const url of wanted) {
      // Failures surface when the card is actually shown.
      if (!this.warm.has(url)) this.textures.acquire(url).catch(() => {});
    }
    this.warm = wanted;
  }

  private flip(): void {
    if (!this.card) return;
    this.flipped = !this.flipped;
  }

  private emit(status: CardStatus): void {
    if (!this.disposed) this.callbacks.onStatus(status);
  }

  /** Removes the current card and releases its textures back to the cache. */
  private clearCard(): void {
    if (this.card) disposeCardObject(this.card);
    this.card = null;
    if (this.cardUrls) {
      this.textures.release(this.cardUrls.front);
      this.textures.release(this.cardUrls.back);
    }
    this.cardUrls = null;
    this.flipped = false;
    this.flipAngle = 0;
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
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    const elapsed = performance.now() - down.t;
    if (elapsed > Math.max(CLICK_MAX_MS, SWIPE_MAX_MS)) return;

    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) {
      // Swipe left (drag content leftwards) = next card.
      this.callbacks.onStep(dx < 0 ? 1 : -1);
      return;
    }
    if (Math.hypot(dx, dy) <= CLICK_MAX_PX && elapsed <= CLICK_MAX_MS && this.hitCard(e)) {
      this.flip();
    }
  };

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    // Arrows work wherever focus is; Enter/Space only when no button or link has it.
    const onControl = e.target !== this.canvas && e.target !== document.body;
    switch (e.key) {
      case "Enter":
      case " ":
        if (onControl) return;
        e.preventDefault();
        this.flip();
        break;
      case "ArrowRight":
        e.preventDefault();
        this.callbacks.onStep(1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.callbacks.onStep(-1);
        break;
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
