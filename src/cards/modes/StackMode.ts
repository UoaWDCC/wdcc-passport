import type { Raycaster } from "three";
import {
  buildCardObject,
  disposeCardObject,
  setCardTextures,
  type CardObject,
  type CardTextures,
} from "../three/buildCard";
import { StackAnimator, type StackCardEntry } from "../three/StackAnimator";
import {
  STACK_COUNT,
  STACK_INTRO_DELAY,
  stackCardHeight,
  stackRest,
} from "../three/StackLayoutBuilder";
import type { CardEntry, SceneDims } from "../types";
import type { Mode, ModeEnv, PointerInfo, TickContext } from "./Mode";

export interface StackCallbacks {
  /** A different card is now on top of the pile. */
  onFocus(index: number): void;
}

// pokebox useSwipeGesture gates
const SWIPE_MIN_PX = 50;
const SWIPE_MAX_MS = 500;
const SWIPE_MIN_VELOCITY = 0.3; // px / ms
/** Pointer travel / duration beyond which a press is no longer a tap on the top card. */
const CLICK_MAX_PX = 8;
const CLICK_MAX_MS = 500;
/** Wheel travel per swipe. */
const STEP_WHEEL_PX = 80;

/**
 * Stack mode: the stack portion of cards-ai-trial's CardScene (pile building,
 * card recycling, swipe / wheel / key input) driving its StackAnimator unchanged.
 * The pile holds at most STACK_COUNT cards; a swipe sends the top card to the
 * bottom, where it is re-pointed at the next unseen card so the whole collection
 * cycles through. Both swipe directions advance the pile.
 */
export class StackMode implements Mode {
  private readonly animator = new StackAnimator();
  private cards: StackCardEntry[] = [];
  /** Manifest index that the next card to reach the bottom of the pile will show. */
  private next = 0;
  /** Bumped on every rebuild so textures that finish late are discarded. */
  private generation = 0;
  private wheelAcc = 0;
  private pointerDownAt: { x: number; y: number; t: number } | null = null;
  /** From the latest tick. */
  private dims: SceneDims = { screenW: 1, screenH: 1, boxD: 1, eyeZ: 1 };

  constructor(
    private readonly env: ModeEnv,
    private readonly entries: readonly CardEntry[],
    index: number,
    private readonly callbacks: StackCallbacks,
  ) {
    void this.build(index);
  }

  dispose(): void {
    this.generation++;
    this.clear();
  }

  /** Index of the top card, or null while the pile is (re)building. */
  topIndex(): number | null {
    return this.top()?.index ?? null;
  }

  /** Bring a card to the top (buttons): the next card swipes in, anything else rebuilds the pile. */
  focus(index: number): void {
    if (this.animator.isSwiping || this.topIndex() === index) return;
    if (this.cards.find((e) => e.slot === 1)?.index === index) this.swipe(1);
    else void this.build(index);
  }

  canFlip(): boolean {
    return this.top() !== undefined && !this.animator.isSwiping;
  }

  tick(ctx: TickContext): void {
    this.dims = ctx.dims;
    const departed = this.animator.tick(this.cards, ctx.now, ctx.dt, {
      cardH: stackCardHeight(ctx.dims),
      dims: ctx.dims,
      tilt: ctx.tilt,
      flipAngle: ctx.flipAngle,
    });
    if (!departed) return;
    // The departed card is now at the bottom (mostly hidden): re-point it at the next unseen
    // card so swiping browses the whole collection, not just the pile.
    if (this.entries.length > STACK_COUNT) {
      void this.reassign(departed, this.next);
      this.next = (this.next + 1) % this.entries.length;
    }
    const top = this.topIndex();
    if (top !== null) this.callbacks.onFocus(top);
  }

  pointerDown(p: PointerInfo): void {
    this.pointerDownAt = { x: p.x, y: p.y, t: p.t };
  }

  pointerMove(p: PointerInfo): boolean {
    const top = this.top();
    return top !== undefined && !this.animator.isSwiping && this.hit(p.ray, top.card);
  }

  pointerUp(p: PointerInfo): "flip" | null {
    const down = this.pointerDownAt;
    this.pointerDownAt = null;
    if (!down) return null;
    const dx = p.x - down.x;
    const dy = p.y - down.y;
    const ms = (p.t - down.t) * 1000;

    if (Math.hypot(dx, dy) <= CLICK_MAX_PX) {
      const top = this.top();
      const tap = ms <= CLICK_MAX_MS && top !== undefined && this.canFlip();
      return tap && this.hit(p.ray, top.card) ? "flip" : null;
    }
    // pokebox useSwipeGesture: vertical travel with distance, duration and velocity gates.
    const dist = Math.abs(dy);
    if (
      dist >= Math.abs(dx) &&
      dist >= SWIPE_MIN_PX &&
      ms <= SWIPE_MAX_MS &&
      dist / ms >= SWIPE_MIN_VELOCITY
    ) {
      this.swipe(dy < 0 ? 1 : -1);
    }
    return null;
  }

  pointerCancel(): void {
    this.pointerDownAt = null;
  }

  pointerLeave(): void {}

  wheel(deltaPx: number): void {
    if (this.animator.isSwiping) {
      this.wheelAcc = 0;
      return;
    }
    this.wheelAcc += deltaPx;
    if (Math.abs(this.wheelAcc) < STEP_WHEEL_PX) return;
    this.swipe(this.wheelAcc > 0 ? 1 : -1);
    this.wheelAcc = 0;
  }

  key(key: string): "flip" | "handled" | null {
    switch (key) {
      case "Enter":
      case " ":
        return this.canFlip() ? "flip" : "handled";
      case "ArrowUp":
      case "ArrowRight":
        this.swipe(1);
        return "handled";
      case "ArrowDown":
      case "ArrowLeft":
        this.swipe(-1);
        return "handled";
    }
    return null;
  }

  private top(): StackCardEntry | undefined {
    return this.cards.find((e) => e.slot === 0);
  }

  /** pokebox swipe: the top card flies off (up or down) and goes to the bottom of the pile. */
  private swipe(direction: 1 | -1): void {
    this.animator.swipe(this.cards, direction, performance.now() / 1000);
  }

  /** Replaces the pile with one whose top card is `index`. A build still loading is discarded. */
  private async build(index: number): Promise<void> {
    const gen = ++this.generation;
    this.clear();
    const n = this.entries.length;
    const m = Math.min(STACK_COUNT, n);
    this.next = (index + m) % n;
    const indices = Array.from({ length: m }, (_, slot) => (index + slot) % n);

    const results = await Promise.allSettled(indices.map((i) => this.acquire(i)));
    const ready: Array<{ index: number; textures: CardTextures }> = [];
    results.forEach((result, k) => {
      const i = indices[k];
      if (result.status === "fulfilled" && gen === this.generation) {
        ready.push({ index: i, textures: result.value });
        return;
      }
      this.releaseTextures(i);
      if (result.status === "rejected") {
        console.warn(`[cards] stack card ${this.entries[i].id} skipped:`, result.reason);
      }
    });
    if (gen !== this.generation) return;

    const now = performance.now() / 1000;
    const cardH = stackCardHeight(this.dims);
    ready.forEach(({ index: i, textures }, slot) => {
      const card = buildCardObject(textures, cardH);
      const rest = stackRest(slot, cardH, this.dims);
      card.group.position.set(rest.x, rest.y, rest.z);
      card.group.visible = false;
      this.env.scene.add(card.group);
      // Staggered intro: bottom card pops first, top card last.
      const intro = this.env.reducedMotion
        ? null
        : { startTime: now, delay: (ready.length - 1 - slot) * STACK_INTRO_DELAY };
      this.cards.push({ slot, index: i, card, intro });
    });
    const top = this.topIndex();
    if (top !== null) this.callbacks.onFocus(top);
  }

  /** Point a pile card at a different manifest card by swapping its textures. */
  private async reassign(entry: StackCardEntry, index: number): Promise<void> {
    if (entry.index === index) return;
    const gen = this.generation;
    let textures: CardTextures;
    try {
      textures = await this.acquire(index);
    } catch (err) {
      this.releaseTextures(index);
      if (gen === this.generation && this.cards.includes(entry)) {
        // Rather than keep showing a card the user has already passed, drop it from the pile.
        console.warn(`[cards] stack card ${this.entries[index].id} skipped:`, err);
        this.remove(entry);
      }
      return;
    }
    if (gen !== this.generation || !this.cards.includes(entry)) {
      this.releaseTextures(index);
      return;
    }
    setCardTextures(entry.card, textures);
    this.releaseTextures(entry.index);
    entry.index = index;
  }

  private remove(entry: StackCardEntry): void {
    disposeCardObject(entry.card);
    this.releaseTextures(entry.index);
    this.cards = this.cards.filter((e) => e !== entry);
    for (const e of this.cards) if (e.slot > entry.slot) e.slot--;
  }

  private acquire(index: number): Promise<CardTextures> {
    const { textures } = this.env;
    const entry = this.entries[index];
    return Promise.all([textures.acquire(entry.front), textures.acquire(entry.back)]).then(
      ([front, back]) => ({ front, back }),
    );
  }

  private releaseTextures(index: number): void {
    this.env.textures.release(this.entries[index].front);
    this.env.textures.release(this.entries[index].back);
  }

  private clear(): void {
    for (const e of this.cards) {
      disposeCardObject(e.card);
      this.releaseTextures(e.index);
    }
    this.cards = [];
    this.wheelAcc = 0;
    this.animator.reset();
  }

  private hit(ray: Raycaster, card: CardObject): boolean {
    return card.group.visible && ray.intersectObjects([card.front, card.back], false).length > 0;
  }
}
