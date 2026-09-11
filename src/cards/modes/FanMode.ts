import type { Mesh, Raycaster } from "three";
import { RARITY_SHADER } from "../shaders";
import { buildCardObject, disposeCardObject, type CardObject } from "../three/buildCard";
import { acquireCardTextures, releaseCardTextures } from "../three/cardTextures";
import { FanAnimator, type FanCardEntry } from "../three/FanAnimator";
import { FAN_INTRO_DELAY, FAN_VISIBLE_RADIUS, fanCardHeight } from "../three/FanLayoutBuilder";
import { zoomedTransform } from "../three/layout";
import type { CardEntry, SceneDims } from "../types";
import type { Mode, ModeEnv, PointerInfo, TickContext } from "./Mode";

export interface FanCallbacks {
  /** The hand settled on this card (after a fling, snap or inspect). */
  onFocus(index: number): void;
  /** A card was zoomed in (true) or sent back to the hand (false). */
  onInspect(inspecting: boolean): void;
}

// CardScene fan constants
const SCROLL_DECAY = 0.02; // fraction of fan scroll velocity left after one second
const SNAP_THRESHOLD = 0.6; // cards / second
const WHEEL_GAIN = 0.035;
const MAX_SCROLL_VEL = 25;
const FAN_INTRO_WINDOW = 1.5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const clamp1 = (v: number) => clamp(v, -1, 1);

/**
 * Fan mode: the fan portion of cards-ai-trial's CardScene (scroll physics, texture
 * window, drag / wheel / click / keys) driving its FanAnimator unchanged.
 */
export class FanMode implements Mode {
  private readonly fanAnimator = new FanAnimator();
  private readonly fanCards = new Map<number, FanCardEntry>();
  private readonly pendingFan = new Set<number>();
  private fanIntroUntil: number;
  private scrollPos: number;
  private scrollVel = 0;
  private snapTarget: number | null;
  private hoveredFan: number | null = null;

  private dragging = false;
  private pointerDownAt: { x: number; y: number; t: number } | null = null;
  private pointerMoved = false;
  private dragLastX = 0;
  private dragLastT = 0;

  /** From the latest tick; needed to start a zoom from an input event. */
  private dims: SceneDims = { screenW: 1, screenH: 1, boxD: 1, eyeZ: 1 };
  private disposed = false;

  constructor(
    private readonly env: ModeEnv,
    private readonly entries: readonly CardEntry[],
    index: number,
    private readonly callbacks: FanCallbacks,
  ) {
    const start = clamp(index, 0, entries.length - 1);
    this.scrollPos = start;
    this.snapTarget = start;
    this.fanIntroUntil = env.reducedMotion ? 0 : performance.now() / 1000 + FAN_INTRO_WINDOW;
  }

  dispose(): void {
    this.disposed = true;
    this.clearFan();
  }

  private isInspecting(): boolean {
    return this.fanAnimator.focusedIndex !== null;
  }

  canFlip(): boolean {
    return this.fanAnimator.zoomedIndex !== null && !this.fanAnimator.isZooming;
  }

  *cards(): Iterable<CardObject> {
    for (const e of this.fanCards.values()) yield e.card;
  }

  /** Centre the hand on a card (buttons). Ignored mid-drag or while inspecting. */
  focus(index: number): void {
    if (this.dragging || this.isInspecting()) return;
    const target = clamp(index, 0, this.entries.length - 1);
    if (this.snapTarget === target || (this.snapTarget === null && this.scrollPos === target))
      return;
    this.scrollVel = 0;
    this.snapTarget = target;
  }

  tick(ctx: TickContext): void {
    this.dims = ctx.dims;
    const { now, dt } = ctx;
    const focused = this.fanAnimator.focusedIndex;
    if (focused === null || this.snapTarget !== null) this.updateScroll(dt);
    this.ensureFanWindow();

    const scrollTilt = clamp1(this.scrollVel * 0.12);
    this.fanAnimator.tick(this.fanCards, now, dt, {
      scrollPos: this.scrollPos,
      cardH: fanCardHeight(this.dims),
      dims: this.dims,
      hovered: this.hoveredFan,
      tilt: ctx.tilt,
      flipAngle: ctx.flipAngle,
      scrollTilt,
      target: zoomedTransform(this.dims),
    });
  }

  pointerDown(p: PointerInfo): void {
    this.pointerDownAt = { x: p.x, y: p.y, t: p.t };
    this.pointerMoved = false;
    if (this.fanAnimator.focusedIndex === null) {
      this.dragging = true;
      this.dragLastX = p.x;
      this.dragLastT = p.t;
      this.scrollVel = 0;
      this.snapTarget = null;
    }
  }

  pointerMove(p: PointerInfo): boolean {
    if (
      this.pointerDownAt &&
      Math.hypot(p.x - this.pointerDownAt.x, p.y - this.pointerDownAt.y) > 4
    ) {
      this.pointerMoved = true;
    }
    if (this.dragging) {
      const dt = Math.max(1e-3, p.t - this.dragLastT);
      const pxPerCard = p.canvasWidth * 0.12;
      const delta = -(p.x - this.dragLastX) / pxPerCard;
      this.scrollPos = clamp(this.scrollPos + delta, -0.4, this.entries.length - 1 + 0.4);
      this.scrollVel = this.scrollVel * 0.6 + (delta / dt) * 0.4;
      this.dragLastX = p.x;
      this.dragLastT = p.t;
      return false;
    }
    if (this.isInspecting()) return false;
    this.hoveredFan = this.fanHit(p.ray);
    return this.hoveredFan !== null;
  }

  pointerUp(p: PointerInfo): "flip" | null {
    this.endDrag(p.t);
    let result: "flip" | null = null;
    if (this.pointerDownAt && !this.pointerMoved) result = this.handleClick(p);
    this.pointerDownAt = null;
    return result;
  }

  pointerCancel(p: PointerInfo): void {
    this.endDrag(p.t);
    this.pointerDownAt = null;
  }

  pointerLeave(): void {
    this.hoveredFan = null;
  }

  wheel(deltaPx: number): void {
    if (this.isInspecting()) return;
    this.snapTarget = null;
    this.scrollVel = clamp(this.scrollVel + deltaPx * WHEEL_GAIN, -MAX_SCROLL_VEL, MAX_SCROLL_VEL);
  }

  key(key: string): "flip" | "handled" | null {
    if (key === "Escape") {
      this.exitInspect();
      return "handled";
    }
    if (key === "Enter" || key === " ") {
      if (this.canFlip()) return "flip";
      if (!this.isInspecting()) {
        const centre = clamp(Math.round(this.scrollPos), 0, this.entries.length - 1);
        const entry = this.fanCards.get(centre);
        if (entry) this.startInspect(entry);
      }
      return "handled";
    }
    const step = key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0;
    if (!step) return null;
    if (!this.isInspecting()) {
      const base = this.snapTarget ?? Math.round(this.scrollPos);
      this.scrollVel = 0;
      this.snapTarget = clamp(base + step, 0, this.entries.length - 1);
    }
    return "handled";
  }

  private endDrag(now: number): void {
    if (!this.dragging) return;
    this.dragging = false;
    // Stale velocity from a paused drag should not fling the fan.
    if (now - this.dragLastT > 0.1) this.scrollVel = 0;
    this.scrollVel = clamp(this.scrollVel, -MAX_SCROLL_VEL, MAX_SCROLL_VEL);
  }

  private handleClick(p: PointerInfo): "flip" | null {
    if (this.fanAnimator.isZooming) return null;
    const zoomed = this.fanAnimator.zoomedIndex;
    if (zoomed !== null) {
      // Click the zoomed card to flip it; click empty space to return to the fan.
      const entry = this.fanCards.get(zoomed);
      if (entry && this.hitCard(p.ray, [entry.card])) return "flip";
      this.exitInspect();
      return null;
    }
    const i = this.fanHit(p.ray);
    const entry = i !== null ? this.fanCards.get(i) : undefined;
    if (entry && !entry.intro) this.startInspect(entry);
    return null;
  }

  private startInspect(entry: FanCardEntry): void {
    this.fanAnimator.startZoom(entry, performance.now() / 1000, this.dims);
    // Re-centre the hand on this card so it returns to the middle slot.
    this.snapTarget = entry.index;
    this.scrollVel = 0;
    this.hoveredFan = null;
    this.callbacks.onFocus(entry.index);
    this.callbacks.onInspect(true);
  }

  private exitInspect(): void {
    const zoomed = this.fanAnimator.zoomedIndex;
    if (zoomed === null) return;
    const entry = this.fanCards.get(zoomed);
    if (entry) this.fanAnimator.startReturn(entry, performance.now() / 1000);
    this.callbacks.onInspect(false);
  }

  private updateScroll(dt: number): void {
    const n = this.entries.length;
    if (this.snapTarget !== null) {
      this.scrollPos += (this.snapTarget - this.scrollPos) * (1 - Math.pow(0.0005, dt));
      if (Math.abs(this.snapTarget - this.scrollPos) < 0.002) {
        this.scrollPos = this.snapTarget;
        this.snapTarget = null;
        this.callbacks.onFocus(this.scrollPos);
      }
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
      this.releaseTextures(idx);
      this.fanCards.delete(idx);
      if (this.hoveredFan === idx) this.hoveredFan = null;
    }

    for (let idx = lo; idx <= hi; idx++) {
      if (this.fanCards.has(idx) || this.pendingFan.has(idx)) continue;
      this.pendingFan.add(idx);
      const entry = this.entries[idx];
      const introDelay = (idx - lo) * FAN_INTRO_DELAY;
      acquireCardTextures(this.env, entry).then(
        ({ textures, fx }) => {
          this.pendingFan.delete(idx);
          if (this.disposed || this.fanCards.has(idx)) {
            this.releaseTextures(idx);
            return;
          }
          const card = buildCardObject(
            textures,
            fanCardHeight(this.dims),
            RARITY_SHADER[entry.rarity],
            fx,
          );
          card.mesh.userData.index = idx;
          card.group.visible = false;
          this.env.scene.add(card.group);
          const t = performance.now() / 1000;
          const intro = t < this.fanIntroUntil ? { startTime: t, delay: introDelay } : null;
          this.fanCards.set(idx, { index: idx, card, lift: 0, intro });
        },
        (err: unknown) => {
          this.pendingFan.delete(idx);
          this.releaseTextures(idx);
          console.warn(`[cards] fan card ${entry.id} skipped:`, err);
        },
      );
    }
  }

  private releaseTextures(idx: number): void {
    releaseCardTextures(this.env, this.entries[idx]);
  }

  private clearFan(): void {
    for (const [idx, e] of this.fanCards) {
      disposeCardObject(e.card);
      this.releaseTextures(idx);
    }
    this.fanCards.clear();
    this.hoveredFan = null;
    this.fanAnimator.reset();
  }

  private hitCard(ray: Raycaster, cards: Iterable<CardObject>): CardObject | null {
    const meshes: Mesh[] = [];
    const byMesh = new Map<Mesh, CardObject>();
    for (const c of cards) {
      if (!c.group.visible) continue;
      meshes.push(c.mesh);
      byMesh.set(c.mesh, c);
    }
    const hit = ray.intersectObjects(meshes, false)[0];
    return hit ? (byMesh.get(hit.object as Mesh) ?? null) : null;
  }

  private fanHit(ray: Raycaster): number | null {
    const card = this.hitCard(
      ray,
      Array.from(this.fanCards.values(), (e) => e.card),
    );
    return card ? (card.mesh.userData.index as number) : null;
  }
}
