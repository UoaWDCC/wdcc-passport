import { Color, PerspectiveCamera, Raycaster, Scene, Vector2, WebGLRenderer } from "three";
import type { Group, Mesh } from "three";
import { PointerTilt } from "./input/PointerTilt";
import {
  buildCardObject,
  disposeCardObject,
  setCardTilt,
  setCardTime,
  type CardObject,
} from "./three/buildCard";
import { ROOM_BACKGROUND, buildRoom, disposeRoom } from "./three/buildRoom";
import { FAR, NEAR, computeDims, updateOffAxisCamera } from "./three/dims";
import { disposeFxTextures, loadFxTextures, type FxTextures } from "./three/fxTextures";
import { FanAnimator, type FanCardEntry, type TiltState } from "./three/FanAnimator";
import { FAN_INTRO_DELAY, FAN_VISIBLE_RADIUS, fanCardHeight } from "./three/FanLayoutBuilder";
import { detectMobile, zoomedTransform } from "./three/layout";
import { SingleAnimator } from "./three/SingleAnimator";
import { StackAnimator, type StackCardEntry } from "./three/StackAnimator";
import { STACK_COUNT, STACK_INTRO_DELAY, stackCardHeight } from "./three/StackLayoutBuilder";
import { CardTextureCache } from "./three/textures";
import type { CardManifestEntry, SceneState, ViewMode } from "./types";

export interface CardSceneCallbacks {
  onState(state: SceneState): void;
}

/** Holo strength, the same for every card. */
export const HOLO_INTENSITY = 0.35;

const FLIP_LERP = 0.08;
const SCROLL_DECAY = 0.02; // fraction of fan scroll velocity left after one second
const SNAP_THRESHOLD = 0.6; // cards / second
const WHEEL_GAIN = 0.035;
const MAX_SCROLL_VEL = 25;
const STEP_WHEEL_PX = 80; // wheel travel per stack swipe / single step
// pokebox useSwipeGesture gates
const SWIPE_MIN_PX = 50;
const SWIPE_MAX_MS = 500;
const SWIPE_MIN_VELOCITY = 0.3; // px / ms

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const clamp1 = (v: number) => clamp(v, -1, 1);

/**
 * Owns the renderer, the room and the full-res cards of the current display mode
 * (fan / stack / single, all ported from pokebox). React drives it through the
 * public setters and the callbacks.
 */
export class CardScene {
  readonly isMobile = detectMobile();

  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly raycaster = new Raycaster();
  private readonly canvas: HTMLCanvasElement;
  private dims = computeDims(1, 1);
  private room: Group | null = null;
  private readonly textures: CardTextureCache;
  /** Helper foil textures shared by every card shader; cards are built once these are in. */
  private fx: FxTextures | null = null;

  // pokebox: stack on mobile, fan on desktop
  private mode: ViewMode = this.isMobile ? "stack" : "fan";
  private readonly intensity = HOLO_INTENSITY;

  // Whichever card is in focus (zoomed fan card, stack top, single) can flip.
  private flipped = false;
  private flipAngle = 0;
  private readonly pointerTilt = new PointerTilt();

  // Fan
  private readonly fanAnimator = new FanAnimator();
  private readonly fanCards = new Map<number, FanCardEntry>();
  private readonly pendingFan = new Set<number>();
  private fanIntroUntil = 0;
  private scrollPos = 0;
  private scrollVel = 0;
  private snapTarget: number | null = null;
  private hoveredFan: number | null = null;

  // Stack
  private readonly stackAnimator = new StackAnimator();
  private stackCards: StackCardEntry[] = [];
  private stackNext = 0; // manifest index that will replace the next departed card
  private stackGeneration = 0;

  // Single
  private readonly singleAnimator = new SingleAnimator();
  private singleIndex = 0;
  private singleGeneration = 0;

  // Shared "current card" across modes so switching keeps your place.
  private currentIndex = 0;

  // Pointer
  private dragging = false;
  private pointerDown: { x: number; y: number; t: number } | null = null;
  private pointerMoved = false;
  private dragLastX = 0;
  private dragLastT = 0;
  private wheelAcc = 0;

  private readonly resizeObserver: ResizeObserver;
  private raf = 0;
  private lastTime = 0;
  private lastCaption: string | null = null;
  private lastInspecting = false;
  private disposed = false;
  private readonly ndc = new Vector2();

  constructor(
    private readonly container: HTMLElement,
    private readonly entries: CardManifestEntry[],
    private readonly callbacks: CardSceneCallbacks,
  ) {
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.canvas = this.renderer.domElement;
    this.canvas.style.cssText =
      "display:block;width:100%;height:100%;touch-action:none;outline:none";
    this.canvas.tabIndex = 0;
    container.appendChild(this.canvas);

    this.camera = new PerspectiveCamera(60, 1, NEAR, FAR);
    this.textures = new CardTextureCache(this.renderer);

    this.pointerTilt.attach(this.canvas);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("keydown", this.onKeyDown);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
    this.onResize();
    this.emitState();

    this.lastTime = performance.now() / 1000;
    this.raf = requestAnimationFrame(this.tick);

    loadFxTextures(this.renderer).then(
      (fx) => {
        if (this.disposed) {
          disposeFxTextures(fx);
          return;
        }
        this.fx = fx;
        this.applyMode();
        this.emitState();
      },
      (err: unknown) => console.error("[cards] failed to load foil textures", err),
    );
  }

  // ───────────────────────── public API ─────────────────────────

  getState(): SceneState {
    const focused = this.captionIndex();
    return {
      mode: this.mode,
      inspecting: this.isInspecting(),
      focusedName: focused !== null ? this.entries[focused].name : null,
      cardCount: this.entries.length,
      isMobile: this.isMobile,
    };
  }

  setMode(mode: ViewMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    this.applyMode();
    this.emitState();
  }

  /** Leave the zoomed fan card (Escape, background click). */
  exitInspect(): void {
    const zoomed = this.fanAnimator.zoomedIndex;
    if (zoomed === null) return;
    const entry = this.fanCards.get(zoomed);
    if (entry) this.fanAnimator.startReturn(entry, performance.now() / 1000);
    this.flipped = false;
    this.emitState();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.pointerTilt.detach();
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKeyDown);

    this.clearFan();
    this.clearStack();
    this.clearSingle();
    if (this.room) disposeRoom(this.room);
    if (this.fx) disposeFxTextures(this.fx);
    this.textures.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }

  // ───────────────────────── state helpers ─────────────────────────

  private emitState(): void {
    const state = this.getState();
    this.lastInspecting = state.inspecting;
    this.lastCaption = state.focusedName;
    this.callbacks.onState(state);
  }

  private isInspecting(): boolean {
    return this.fanAnimator.focusedIndex !== null;
  }

  /** Manifest index of the card shown in the caption, if any. */
  private captionIndex(): number | null {
    switch (this.mode) {
      case "fan":
        return this.fanAnimator.focusedIndex;
      case "stack":
        return this.stackCards.find((e) => e.slot === 0)?.index ?? null;
      case "single":
        return this.singleAnimator.current?.index ?? null;
    }
  }

  private *allCards(): Iterable<CardObject> {
    for (const e of this.fanCards.values()) yield e.card;
    for (const e of this.stackCards) yield e.card;
    if (this.singleAnimator.current) yield this.singleAnimator.current.card;
  }

  private onResize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.dims = computeDims(w, h);
    // Eye fixed straight in front of the screen centre: the screen is a window into the box.
    updateOffAxisCamera(this.camera, this.dims, 0, 0, this.dims.eyeZ);
    if (this.room) disposeRoom(this.room);
    this.room = buildRoom(this.dims);
    this.scene.add(this.room);
    this.scene.background = new Color(ROOM_BACKGROUND);
  }

  private applyMode(): void {
    if (!this.fx) return;
    this.flipped = false;
    this.wheelAcc = 0;
    this.canvas.style.cursor = "";
    if (this.mode !== "fan") this.clearFan();
    if (this.mode !== "stack") this.clearStack();
    if (this.mode !== "single") this.clearSingle();

    switch (this.mode) {
      case "fan":
        this.fanIntroUntil = performance.now() / 1000 + 1.5;
        this.scrollPos = this.currentIndex;
        this.snapTarget = this.currentIndex;
        this.scrollVel = 0;
        break;
      case "stack":
        this.buildStack();
        break;
      case "single":
        this.showSingle(this.currentIndex);
        break;
    }
  }

  private tilt(): TiltState {
    return { rotateX: this.pointerTilt.rotateX, rotateY: this.pointerTilt.rotateY };
  }

  // ───────────────────────── fan ─────────────────────────

  private clearFan(): void {
    for (const [idx, e] of this.fanCards) {
      disposeCardObject(e.card);
      this.textures.release(this.entries[idx].id);
    }
    this.fanCards.clear();
    this.hoveredFan = null;
    this.fanAnimator.reset();
  }

  /** Keep full-res cards only around the scroll position; load/dispose as it moves. */
  private ensureFanWindow(): void {
    const n = this.entries.length;
    const centre = Math.round(clamp(this.scrollPos, 0, n - 1));
    const lo = Math.max(0, centre - FAN_VISIBLE_RADIUS);
    const hi = Math.min(n - 1, centre + FAN_VISIBLE_RADIUS);
    const focused = this.fanAnimator.focusedIndex;

    for (const [idx, e] of this.fanCards) {
      if ((idx >= lo && idx <= hi) || idx === focused) continue;
      disposeCardObject(e.card);
      this.textures.release(this.entries[idx].id);
      this.fanCards.delete(idx);
      if (this.hoveredFan === idx) this.hoveredFan = null;
    }

    for (let idx = lo; idx <= hi; idx++) {
      if (this.fanCards.has(idx) || this.pendingFan.has(idx)) continue;
      this.pendingFan.add(idx);
      const entry = this.entries[idx];
      const introDelay = (idx - lo) * FAN_INTRO_DELAY;
      this.textures.acquire(entry).then(
        (tex) => {
          this.pendingFan.delete(idx);
          if (this.disposed || !this.fx || this.mode !== "fan" || this.fanCards.has(idx)) {
            this.textures.release(entry.id);
            return;
          }
          const card = buildCardObject(
            fanCardHeight(this.dims),
            tex,
            entry.shader,
            this.intensity,
            this.fx!,
          );
          card.mesh.userData.index = idx;
          card.group.visible = false;
          this.scene.add(card.group);
          const t = performance.now() / 1000;
          const intro = t < this.fanIntroUntil ? { startTime: t, delay: introDelay } : null;
          this.fanCards.set(idx, { index: idx, card, lift: 0, intro });
        },
        () => {
          this.pendingFan.delete(idx);
          this.textures.release(entry.id);
        },
      );
    }
  }

  private updateScroll(dt: number): void {
    const n = this.entries.length;
    if (this.snapTarget !== null) {
      this.scrollPos += (this.snapTarget - this.scrollPos) * (1 - Math.pow(0.0005, dt));
      if (Math.abs(this.snapTarget - this.scrollPos) < 0.002) {
        this.scrollPos = this.snapTarget;
        this.snapTarget = null;
      }
      this.currentIndex = clamp(Math.round(this.scrollPos), 0, n - 1);
      return;
    }
    if (this.dragging) return;

    this.scrollPos += this.scrollVel * dt;
    this.scrollVel *= Math.pow(SCROLL_DECAY, dt);
    const over =
      this.scrollPos < 0 ? this.scrollPos : this.scrollPos > n - 1 ? this.scrollPos - (n - 1) : 0;
    if (over !== 0) this.scrollVel *= 0.6; // rubber band
    if (Math.abs(this.scrollVel) < SNAP_THRESHOLD || (over !== 0 && Math.abs(over) > 0.35)) {
      this.scrollVel = 0;
      this.snapTarget = clamp(Math.round(this.scrollPos), 0, n - 1);
    }
    this.currentIndex = clamp(Math.round(this.scrollPos), 0, n - 1);
  }

  private updateFan(now: number, dt: number, tilt: TiltState): void {
    const focused = this.fanAnimator.focusedIndex;
    if (focused === null || this.snapTarget !== null) this.updateScroll(dt);
    this.ensureFanWindow();

    const scrollTilt = clamp1(this.scrollVel * 0.12);
    this.fanAnimator.tick(this.fanCards, now, dt, {
      scrollPos: this.scrollPos,
      cardH: fanCardHeight(this.dims),
      dims: this.dims,
      hovered: this.hoveredFan,
      tilt,
      flipAngle: this.flipAngle,
      scrollTilt,
      target: zoomedTransform(this.dims),
    });

    // Holo uniforms: a fraction of the scroll velocity plus the card's arc offset, so the
    // bands sweep across each card as it passes the centre; the zoomed card follows the pointer.
    const px = this.pointerTilt.x;
    const py = this.pointerTilt.y;
    for (const e of this.fanCards.values()) {
      if (e.index === this.fanAnimator.zoomedIndex) setCardTilt(e.card, px, py);
      else
        setCardTilt(
          e.card,
          clamp1(scrollTilt + px * 0.5 + (e.index - this.scrollPos) * 0.12),
          py * 0.5,
        );
    }
  }

  // ───────────────────────── stack ─────────────────────────

  private clearStack(): void {
    this.stackGeneration++;
    for (const e of this.stackCards) {
      disposeCardObject(e.card);
      this.textures.release(this.entries[e.index].id);
    }
    this.stackCards = [];
    this.stackAnimator.reset();
  }

  private buildStack(): void {
    this.clearStack();
    const gen = this.stackGeneration;
    const n = this.entries.length;
    const m = Math.min(STACK_COUNT, n);
    const now = performance.now() / 1000;
    this.stackNext = (this.currentIndex + m) % n;
    for (let slot = 0; slot < m; slot++) {
      const index = (this.currentIndex + slot) % n;
      const entry = this.entries[index];
      this.textures.acquire(entry).then(
        (tex) => {
          if (this.disposed || !this.fx || gen !== this.stackGeneration) {
            this.textures.release(entry.id);
            return;
          }
          const card = buildCardObject(
            stackCardHeight(this.dims),
            tex,
            entry.shader,
            this.intensity,
            this.fx!,
          );
          card.group.visible = false;
          this.scene.add(card.group);
          // Staggered intro: back card (last) pops first, top card last
          this.stackCards.push({
            slot,
            index,
            card,
            intro: { startTime: now, delay: (m - 1 - slot) * STACK_INTRO_DELAY },
          });
          if (slot === 0) this.emitState();
        },
        () => this.textures.release(entry.id),
      );
    }
  }

  /** Point an existing pile card at a different manifest card (swap its textures). */
  private async reassignStackCard(entry: StackCardEntry, index: number): Promise<void> {
    if (entry.index === index) return;
    const gen = this.stackGeneration;
    const target = this.entries[index];
    const tex = await this.textures.acquire(target);
    if (
      this.disposed ||
      !this.fx ||
      gen !== this.stackGeneration ||
      !this.stackCards.includes(entry)
    ) {
      this.textures.release(target.id);
      return;
    }
    const old = entry.card;
    const card = buildCardObject(old.group.scale.x, tex, target.shader, this.intensity, this.fx!);
    card.group.position.copy(old.group.position);
    card.group.rotation.copy(old.group.rotation);
    this.scene.add(card.group);
    disposeCardObject(old);
    this.textures.release(this.entries[entry.index].id);
    entry.card = card;
    entry.index = index;
  }

  /** pokebox swipe: the top card flies off (up or down) and goes to the bottom of the pile. */
  private swipeStack(direction: 1 | -1): void {
    const n = this.entries.length;
    if (n < 2 || this.stackCards.length < Math.min(STACK_COUNT, n)) return;
    if (this.stackAnimator.swipe(this.stackCards, direction, performance.now() / 1000))
      this.flipped = false;
  }

  private updateStack(now: number, dt: number, tilt: TiltState): void {
    const n = this.entries.length;
    const departed = this.stackAnimator.tick(this.stackCards, now, dt, {
      cardH: stackCardHeight(this.dims),
      dims: this.dims,
      tilt,
      flipAngle: this.flipAngle,
    });
    if (departed) {
      // The departed card is now at the bottom (mostly hidden): re-point it at the next unseen card
      // so swiping browses the whole collection, not just five cards.
      if (n > STACK_COUNT) {
        void this.reassignStackCard(departed, this.stackNext);
        this.stackNext = (this.stackNext + 1) % n;
      }
      this.currentIndex = this.stackCards.find((e) => e.slot === 0)?.index ?? this.currentIndex;
    }
    const px = this.pointerTilt.x;
    const py = this.pointerTilt.y;
    for (const e of this.stackCards) {
      const f = e.slot === 0 ? 1 : Math.max(0.1, 1 - e.slot * 0.25);
      setCardTilt(e.card, px * f, py * f);
    }
  }

  // ───────────────────────── single ─────────────────────────

  private clearSingle(): void {
    this.singleGeneration++;
    for (const e of this.singleAnimator.clear()) {
      disposeCardObject(e.card);
      this.textures.release(this.entries[e.index].id);
    }
  }

  private showSingle(index: number): void {
    const n = this.entries.length;
    if (n === 0) return;
    index = ((index % n) + n) % n;
    this.singleIndex = index;
    this.currentIndex = index;
    this.flipped = false;
    const gen = ++this.singleGeneration;
    const entry = this.entries[index];
    this.textures.acquire(entry).then(
      (tex) => {
        if (this.disposed || !this.fx || this.mode !== "single" || gen !== this.singleGeneration) {
          this.textures.release(entry.id);
          return;
        }
        const card = buildCardObject(1, tex, entry.shader, this.intensity, this.fx!);
        this.scene.add(card.group);
        const departed = this.singleAnimator.navigate(
          { index, card },
          performance.now() / 1000,
          this.dims,
        );
        if (departed) {
          disposeCardObject(departed.card);
          this.textures.release(this.entries[departed.index].id);
        }
        this.emitState();
      },
      () => this.textures.release(entry.id),
    );
  }

  private updateSingle(now: number, tilt: TiltState): void {
    const departed = this.singleAnimator.tick(now, {
      dims: this.dims,
      tilt,
      flipAngle: this.flipAngle,
      idleFloat: true,
    });
    if (departed) {
      disposeCardObject(departed.card);
      this.textures.release(this.entries[departed.index].id);
    }
    const cur = this.singleAnimator.current;
    if (cur) setCardTilt(cur.card, this.pointerTilt.x, this.pointerTilt.y);
  }

  // ───────────────────────── frame ─────────────────────────

  private readonly tick = (): void => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    const now = performance.now() / 1000;
    const dt = Math.min(now - this.lastTime, 0.1);
    this.lastTime = now;

    this.pointerTilt.update(dt);
    this.flipAngle += ((this.flipped ? Math.PI : 0) - this.flipAngle) * FLIP_LERP;
    const tilt = this.tilt();

    switch (this.mode) {
      case "fan":
        this.updateFan(now, dt, tilt);
        break;
      case "stack":
        this.updateStack(now, dt, tilt);
        break;
      case "single":
        this.updateSingle(now, tilt);
        break;
    }

    for (const card of this.allCards()) setCardTime(card, now);
    const state = this.getState();
    if (state.inspecting !== this.lastInspecting || state.focusedName !== this.lastCaption)
      this.emitState();
    this.renderer.render(this.scene, this.camera);
  };

  // ───────────────────────── input ─────────────────────────

  private setNdc(e: { clientX: number; clientY: number }): void {
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -(((e.clientY - rect.top) / rect.height) * 2 - 1),
    );
    this.raycaster.setFromCamera(this.ndc, this.camera);
  }

  /** Nearest card under the pointer (front or back face). */
  private hitCard(cards: Iterable<CardObject>): CardObject | null {
    const meshes: Mesh[] = [];
    const byMesh = new Map<Mesh, CardObject>();
    for (const c of cards) {
      if (!c.group.visible) continue;
      meshes.push(c.mesh);
      byMesh.set(c.mesh, c);
    }
    const hit = this.raycaster.intersectObjects(meshes, false)[0];
    return hit ? (byMesh.get(hit.object as Mesh) ?? null) : null;
  }

  private fanHit(): number | null {
    const card = this.hitCard(Array.from(this.fanCards.values(), (e) => e.card));
    return card ? (card.mesh.userData.index as number) : null;
  }

  private stackTop(): StackCardEntry | undefined {
    return this.stackCards.find((e) => e.slot === 0);
  }

  /** Card under the pointer in the current mode (for the cursor). */
  private hoverTarget(): CardObject | null {
    switch (this.mode) {
      case "fan":
        return this.hitCard(Array.from(this.fanCards.values(), (e) => e.card));
      case "stack": {
        const top = this.stackTop();
        return top ? this.hitCard([top.card]) : null;
      }
      case "single":
        return this.singleAnimator.current
          ? this.hitCard([this.singleAnimator.current.card])
          : null;
    }
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.canvas.focus({ preventScroll: true });
    const now = performance.now() / 1000;
    this.pointerDown = { x: e.clientX, y: e.clientY, t: now };
    this.pointerMoved = false;
    if (this.mode === "fan" && this.fanAnimator.focusedIndex === null) {
      this.dragging = true;
      this.dragLastX = e.clientX;
      this.dragLastT = now;
      this.scrollVel = 0;
      this.snapTarget = null;
      this.canvas.setPointerCapture(e.pointerId);
    }
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (
      this.pointerDown &&
      Math.hypot(e.clientX - this.pointerDown.x, e.clientY - this.pointerDown.y) > 4
    ) {
      this.pointerMoved = true;
    }
    if (this.dragging) {
      const now = performance.now() / 1000;
      const dt = Math.max(1e-3, now - this.dragLastT);
      const pxPerCard = this.canvas.clientWidth * 0.12;
      const delta = -(e.clientX - this.dragLastX) / pxPerCard;
      this.scrollPos = clamp(this.scrollPos + delta, -0.4, this.entries.length - 1 + 0.4);
      this.scrollVel = this.scrollVel * 0.6 + (delta / dt) * 0.4;
      this.dragLastX = e.clientX;
      this.dragLastT = now;
      return;
    }
    if (this.isInspecting()) return;

    this.setNdc(e);
    if (this.mode === "fan") {
      this.hoveredFan = this.fanHit();
      this.canvas.style.cursor = this.hoveredFan !== null ? "pointer" : "";
      return;
    }
    this.canvas.style.cursor = this.hoverTarget() ? "pointer" : "";
  };

  private readonly onPointerUp = (e: PointerEvent): void => {
    const now = performance.now() / 1000;
    if (this.dragging) {
      this.dragging = false;
      if (this.canvas.hasPointerCapture(e.pointerId))
        this.canvas.releasePointerCapture(e.pointerId);
      // Stale velocity from a paused drag should not fling the fan.
      if (now - this.dragLastT > 0.1) this.scrollVel = 0;
      this.scrollVel = clamp(this.scrollVel, -MAX_SCROLL_VEL, MAX_SCROLL_VEL);
    }
    if (this.pointerDown && e.type === "pointerup") {
      if (!this.pointerMoved) {
        this.handleClick(e);
      } else if (!this.isInspecting()) {
        // pokebox useSwipeGesture: distance, duration and velocity gates.
        const dx = e.clientX - this.pointerDown.x;
        const dy = e.clientY - this.pointerDown.y;
        const ms = (now - this.pointerDown.t) * 1000;
        const vertical = Math.abs(dy) >= Math.abs(dx);
        const dist = vertical ? Math.abs(dy) : Math.abs(dx);
        if (dist >= SWIPE_MIN_PX && ms <= SWIPE_MAX_MS && dist / ms >= SWIPE_MIN_VELOCITY) {
          if (this.mode === "stack" && vertical) this.swipeStack(dy < 0 ? 1 : -1);
          else if (this.mode === "single" && !vertical)
            this.showSingle(this.singleIndex + (dx < 0 ? 1 : -1));
        }
      }
    }
    this.pointerDown = null;
  };

  private readonly onPointerLeave = (): void => {
    this.hoveredFan = null;
    this.canvas.style.cursor = "";
  };

  private handleClick(e: PointerEvent): void {
    this.setNdc(e);
    const now = performance.now() / 1000;

    switch (this.mode) {
      case "fan": {
        if (this.fanAnimator.isZooming) return;
        const zoomed = this.fanAnimator.zoomedIndex;
        if (zoomed !== null) {
          // Click the zoomed card to flip it; click empty space to return to the fan.
          const entry = this.fanCards.get(zoomed);
          if (entry && this.hitCard([entry.card])) this.flipped = !this.flipped;
          else this.exitInspect();
          return;
        }
        const i = this.fanHit();
        const entry = i !== null ? this.fanCards.get(i) : undefined;
        if (entry && !entry.intro) {
          this.fanAnimator.startZoom(entry, now, this.dims);
          // Re-centre the hand on this card so it returns to the middle slot.
          this.snapTarget = i;
          this.scrollVel = 0;
          this.hoveredFan = null;
          this.flipped = false;
          this.emitState();
        }
        return;
      }
      case "stack": {
        const top = this.stackTop();
        if (top && !this.stackAnimator.isSwiping && this.hitCard([top.card]))
          this.flipped = !this.flipped;
        return;
      }
      case "single": {
        const cur = this.singleAnimator.current;
        if (cur && this.hitCard([cur.card])) this.flipped = !this.flipped;
        return;
      }
    }
  }

  private readonly onWheel = (e: WheelEvent): void => {
    if (this.isInspecting()) return;
    e.preventDefault();
    const scale = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 400 : 1;
    const dominant = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * scale;
    if (this.mode === "fan") {
      this.snapTarget = null;
      this.scrollVel = clamp(
        this.scrollVel + dominant * WHEEL_GAIN,
        -MAX_SCROLL_VEL,
        MAX_SCROLL_VEL,
      );
      return;
    }
    if (this.mode === "stack" && this.stackAnimator.isSwiping) {
      this.wheelAcc = 0;
      return;
    }
    this.wheelAcc += this.mode === "stack" ? e.deltaY * scale : dominant;
    if (Math.abs(this.wheelAcc) >= STEP_WHEEL_PX) {
      const dir = this.wheelAcc > 0 ? 1 : -1;
      this.wheelAcc = 0;
      if (this.mode === "stack") this.swipeStack(dir);
      else this.showSingle(this.singleIndex + dir);
    }
  };

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (e.key === "Escape") {
      this.exitInspect();
      return;
    }
    if (this.isInspecting()) return;
    const horizontal = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    const vertical = e.key === "ArrowDown" ? -1 : e.key === "ArrowUp" ? 1 : 0;
    // pokebox: n / b step forward / back
    const nb = e.key === "n" ? 1 : e.key === "b" ? -1 : 0;
    const step = horizontal || nb;
    if (!step && !vertical) return;
    e.preventDefault();
    switch (this.mode) {
      case "fan":
        if (step) {
          const base = this.snapTarget ?? Math.round(this.scrollPos);
          this.scrollVel = 0;
          this.snapTarget = clamp(base + step, 0, this.entries.length - 1);
        }
        break;
      case "stack":
        this.swipeStack((vertical || step) > 0 ? 1 : -1);
        break;
      case "single":
        if (step) this.showSingle(this.singleIndex + step);
        break;
    }
  };
}
