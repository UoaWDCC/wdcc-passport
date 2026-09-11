import {
  Color,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  WebGLRenderer,
  type Group,
} from "three";
import { PointerTilt } from "./input/PointerTilt";
import { FanMode } from "./modes/FanMode";
import type { Mode, ModeEnv, PointerInfo } from "./modes/Mode";
import { SingleMode, type CardStatus } from "./modes/SingleMode";
import { StackMode } from "./modes/StackMode";
import { CARD_ASPECT, disableShaders, applyFallbackMaterial } from "./three/buildCard";
import { ROOM_BACKGROUND, buildRoom, disposeRoom } from "./three/buildRoom";
import { SCREEN_H_CM, VIEW_DISTANCE_CM, computeDims } from "./three/dims";
import { disposeFxTextures, loadFxTextures } from "./three/fxTextures";
import { updateCardUniforms } from "./three/shaderUniforms";
import { TextureCache } from "./three/textures";
import type { CardEntry, SceneDims } from "./types";

export type { CardStatus } from "./modes/SingleMode";

export interface CardSceneCallbacks {
  /** Load progress of the single-mode card. */
  onStatus(status: CardStatus): void;
  /** The user swiped or pressed an arrow key: +1 = next card, -1 = previous. */
  onStep(delta: number): void;
  /** Fan mode settled on this card, or it reached the top of the stack. */
  onFocus(index: number): void;
  /** Fan mode zoomed a card in (true) or returned it to the hand (false). */
  onInspect(inspecting: boolean): void;
  /** A holo shader failed to compile; cards are shown as plain images from now on. */
  onEffectsUnavailable(): void;
}

/** World units are pokebox's centimetres: the eye sits 60 cm from a 24.81 cm-tall screen at z = 0. */
const CAMERA_DISTANCE = VIEW_DISTANCE_CM;
const CAMERA_FOV = (2 * Math.atan(SCREEN_H_CM / 2 / CAMERA_DISTANCE) * 180) / Math.PI;
/** Card height as a fraction of the visible height, capped so it never exceeds 90% of the width. */
const CARD_FILL = 0.85;
const MAX_PIXEL_RATIO = 2;
const FLIP_LERP = 0.08;

/**
 * Renderer, camera, frame loop, pointer tilt and flip state, shared by every mode.
 * One mode is active at a time and owns its cards; the scene forwards input to it
 * and ticks it every frame. `dispose()` releases everything.
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
  private readonly env: ModeEnv;

  private mode: Mode | null = null;
  private room: Group | null = null;
  private effectsBroken = false;
  private dims: SceneDims = computeDims(1, 1);
  private flipped = false;
  private flipAngle = 0;
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
    // Output stays sRGB (three's default): that only gamma-encodes built-in materials
    // (the room), never a ShaderMaterial, so the card shaders' gamma-space output
    // reaches the screen untouched.
    this.renderer.debug.onShaderError = this.onShaderError;
    this.canvas = this.renderer.domElement;
    this.canvas.style.cssText =
      "display:block;width:100%;height:100%;touch-action:none;outline:none";
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute(
      "aria-label",
      "3D cards. Arrow keys change card; Enter flips or inspects; Escape returns.",
    );
    container.appendChild(this.canvas);

    this.scene.background = new Color(ROOM_BACKGROUND);
    this.camera = new PerspectiveCamera(CAMERA_FOV, 1, 1, 1000);
    this.camera.position.z = CAMERA_DISTANCE;
    this.textures = new TextureCache(this.renderer);
    this.env = {
      scene: this.scene,
      textures: this.textures,
      fx: loadFxTextures(this.renderer),
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };

    this.pointerTilt.attach(this.canvas);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerCancel);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("visibilitychange", this.onVisibilityChange);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
    this.onResize();
  }

  dispose(): void {
    this.disposed = true;
    this.stopLoop();
    this.resizeObserver.disconnect();
    this.pointerTilt.detach();
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);

    this.setMode(null);
    if (this.room) disposeRoom(this.room);
    void this.env.fx.then(disposeFxTextures);
    this.textures.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
  }

  /** Single mode: show one card and keep its neighbours' textures warm. */
  showSingle(entry: CardEntry, neighbours: readonly CardEntry[]): void {
    let single = this.mode instanceof SingleMode ? this.mode : null;
    if (!single) {
      single = new SingleMode(this.env, {
        onStatus: (s) => this.callbacks.onStatus(s),
        onStep: (d) => this.callbacks.onStep(d),
      });
      this.setMode(single);
    }
    this.flipped = false;
    void single.show(entry);
    single.preload(neighbours);
  }

  /** Fan mode centred on a card. Repeated calls with a new index re-centre the hand. */
  showFan(entries: readonly CardEntry[], index: number): void {
    if (this.mode instanceof FanMode) {
      this.mode.focus(index);
      return;
    }
    const fan = new FanMode(this.env, entries, index, {
      onFocus: (i) => this.callbacks.onFocus(i),
      onInspect: (v) => {
        this.flipped = false;
        this.callbacks.onInspect(v);
      },
    });
    this.setMode(fan);
    this.callbacks.onStatus({ kind: "ready" });
  }

  /** Stack mode with a card on top. Repeated calls with a new index bring that card to the top. */
  showStack(entries: readonly CardEntry[], index: number): void {
    if (this.mode instanceof StackMode) {
      this.mode.focus(index);
      return;
    }
    this.setMode(
      new StackMode(this.env, entries, index, { onFocus: (i) => this.callbacks.onFocus(i) }),
    );
    this.callbacks.onStatus({ kind: "ready" });
  }

  private setMode(mode: Mode | null): void {
    this.mode?.dispose();
    this.mode = mode;
    this.flipped = false;
    this.flipAngle = 0;
    this.canvas.style.cursor = "";
    if (mode) this.startLoop();
  }

  private flip(): void {
    if (this.mode?.canFlip()) this.flipped = !this.flipped;
  }

  /** Visible world size at the card plane (z = 0). */
  private view(): { width: number; height: number } {
    return { width: this.dims.screenW, height: this.dims.screenH };
  }

  private singleHeight(): number {
    const { width, height } = this.view();
    return Math.min(height * CARD_FILL, (width * 0.9) / CARD_ASPECT);
  }

  private onResize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.dims = computeDims(w, h);
    // The room is sized to the view, so it is rebuilt with it (pokebox rebuilds the box too).
    if (this.room) disposeRoom(this.room);
    this.room = buildRoom(this.dims);
    this.scene.add(this.room);
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
    // The flip belongs to the focused card; once it moves on (stack swipe, fan return) unflip.
    if (this.flipped && !this.mode?.canFlip()) this.flipped = false;
    const target = this.flipped ? Math.PI : 0;
    this.flipAngle = this.env.reducedMotion
      ? target
      : this.flipAngle + (target - this.flipAngle) * FLIP_LERP;

    this.mode?.tick({
      now,
      dt,
      view: this.view(),
      dims: this.dims,
      singleHeight: this.singleHeight(),
      tilt: { rotateX: this.pointerTilt.rotateX, rotateY: this.pointerTilt.rotateY },
      flipAngle: this.flipAngle,
    });
    if (this.mode) updateCardUniforms(this.mode.cards(), now, this.dims.eyeZ);
    this.renderer.render(this.scene, this.camera);
  };

  /** three.js reports a shader that failed to compile: drop to plain cards, once. */
  private readonly onShaderError = (
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ): void => {
    console.error(
      "[cards] holo shader failed to compile:",
      gl.getProgramInfoLog(program),
      gl.getShaderInfoLog(vertexShader),
      gl.getShaderInfoLog(fragmentShader),
    );
    if (this.effectsBroken) return;
    this.effectsBroken = true;
    disableShaders();
    // Called mid-render; swap materials after the frame finishes.
    queueMicrotask(() => {
      if (this.disposed) return;
      for (const card of this.mode?.cards() ?? []) applyFallbackMaterial(card);
      this.callbacks.onEffectsUnavailable();
    });
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.stopLoop();
    else if (this.mode) this.startLoop();
  };

  /** Pointer event -> mode input, with the raycaster aimed through the pointer. */
  private pointerInfo(e: PointerEvent): PointerInfo {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    return {
      x: e.clientX,
      y: e.clientY,
      t: performance.now() / 1000,
      ray: this.raycaster,
      canvasWidth: this.canvas.clientWidth,
    };
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.canvas.focus({ preventScroll: true });
    this.canvas.setPointerCapture(e.pointerId);
    this.mode?.pointerDown(this.pointerInfo(e));
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (!this.mode) return;
    const hovering = this.mode.pointerMove(this.pointerInfo(e));
    this.canvas.style.cursor = hovering ? "pointer" : "";
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    if (this.mode?.pointerUp(this.pointerInfo(e)) === "flip") this.flip();
  };

  private readonly onPointerCancel = (e: PointerEvent): void => {
    this.mode?.pointerCancel(this.pointerInfo(e));
  };

  private readonly onPointerLeave = (): void => {
    this.mode?.pointerLeave();
    this.canvas.style.cursor = "";
  };

  private readonly onWheel = (e: WheelEvent): void => {
    if (!this.mode) return;
    e.preventDefault();
    // Lines / pages -> pixels, then follow whichever axis the device is scrolling on.
    const scale = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 400 : 1;
    const dominant = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    this.mode.wheel(dominant * scale);
  };

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (!this.mode) return;
    // Enter/Space belong to whichever button or link has focus; other keys work anywhere.
    const onControl = e.target !== this.canvas && e.target !== document.body;
    if (onControl && (e.key === "Enter" || e.key === " ")) return;
    const result = this.mode.key(e.key);
    if (!result) return;
    e.preventDefault();
    if (result === "flip") this.flip();
  };
}
