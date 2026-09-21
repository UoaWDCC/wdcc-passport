import type { Raycaster } from "three";
import { RARITY_SHADER } from "../shaders";
import {
  buildCardObject,
  disposeCardObject,
  setCardTextures,
  type CardObject,
} from "../three/buildCard";
import { acquireCardTextures, releaseCardTextures, type LoadedCard } from "../three/cardTextures";
import { RevealEffects } from "../three/revealFx";
import { StackAnimator, type StackCardEntry } from "../three/StackAnimator";
import {
  STACK_COUNT,
  STACK_INTRO_DELAY,
  stackCardHeight,
  stackRest,
} from "../three/StackLayoutBuilder";
import { type SwipeAxis } from "../three/layout";
import type { CardEntry, SceneDims } from "../types";
import type { Mode, ModeEnv, PointerInfo, TickContext } from "./Mode";

export interface StackCallbacks {
  /** A different card is now on top of the pile. */
  onFocus(index: number): void;
  /** Once mode: the last card has been swiped away. */
  onEmpty?(): void;
  /** Reveal mode: this card just reached the top of the pile and had its reveal moment. */
  onReveal?(index: number): void;
}

export interface StackOptions {
  /** Swiped cards leave the pile for good instead of going to the bottom, so each is seen once. */
  once?: boolean;
  /**
   * Pack reveal: the pile is thrown out of the pack, and each card gets its rarity's aura on
   * reaching the top (a legendary, a whole show).
   */
  reveal?: boolean;
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
  private readonly fx: RevealEffects | null;
  private pile: StackCardEntry[] = [];
  /** Manifest index that the next card to reach the bottom of the pile will show. */
  private next = 0;
  /** Bumped on every rebuild so textures that finish late are discarded. */
  private generation = 0;
  private wheelAcc = 0;
  private pulling = false;
  private pointerDownAt: { x: number; y: number; t: number } | null = null;
  /** From the latest tick. */
  private dims: SceneDims = { screenW: 1, screenH: 1, boxD: 1, eyeZ: 1 };

  constructor(
    private readonly env: ModeEnv,
    private readonly entries: readonly CardEntry[],
    index: number,
    private readonly callbacks: StackCallbacks,
    private readonly options: StackOptions = {},
  ) {
    this.fx = options.reveal ? new RevealEffects(env.scene, env.reducedMotion) : null;
    void this.build(index);
  }

  dispose(): void {
    this.generation++;
    this.clear();
    this.fx?.dispose();
  }

  /** Index of the top card, or null while the pile is (re)building. */
  topIndex(): number | null {
    return this.top()?.index ?? null;
  }

  /**
   * Bring a card to the top (buttons): the next card swipes in, the previous card is
   * pulled back onto the pile, anything else rebuilds the pile.
   */
  focus(index: number): void {
    const top = this.topIndex();
    if (this.animator.isSwiping || this.pulling || top === null || top === index) return;
    const n = this.entries.length;
    if (this.pile.find((e) => e.slot === 1)?.index === index) this.swipe(1);
    else if (index === (top - 1 + n) % n && this.pile.length > 1) void this.pullBack(index);
    else void this.build(index);
  }

  canFlip(): boolean {
    return (
      this.top() !== undefined &&
      !this.animator.isSwiping &&
      !this.pulling &&
      !this.animator.isShowcasing(this.pile)
    );
  }

  cards(): CardObject[] {
    return this.pile.map((e) => e.card);
  }

  tick(ctx: TickContext): void {
    this.dims = ctx.dims;
    const departed = this.animator.tick(this.pile, ctx.now, ctx.dt, {
      cardH: stackCardHeight(ctx.dims),
      dims: ctx.dims,
      tilt: ctx.tilt,
      flipAngle: ctx.flipAngle,
      reveal: this.options.reveal,
      reducedMotion: this.env.reducedMotion,
    });
    const revealed = this.animator.takeRevealed();
    if (revealed) {
      this.fx?.burst(revealed.card, revealed.rarity ?? "common");
      this.callbacks.onReveal?.(revealed.index);
    }
    this.fx?.tick(
      ctx.now,
      ctx.dt,
      this.pile.map((e) => ({
        card: e.card,
        slot: e.slot,
        rarity: e.rarity ?? "common",
        revealed: e.revealed === true,
        charge: this.animator.chargeProgress(e, ctx.now),
        showcase: this.animator.showcaseProgress(e, ctx.now),
      })),
    );
    if (!departed) return;
    if (this.options.once) {
      this.remove(departed);
      if (this.pile.length === 0) {
        this.callbacks.onEmpty?.();
        return;
      }
    } else if (this.entries.length > STACK_COUNT) {
      // The departed card is now at the bottom (mostly hidden): re-point it at the next unseen
      // card so swiping browses the whole collection, not just the pile.
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
      // A tap during a legendary's showcase skips to the settled card.
      if (this.animator.isShowcasing(this.pile)) {
        this.animator.skipShowcase(this.pile);
        return null;
      }
      const top = this.top();
      const tap = ms <= CLICK_MAX_MS && top !== undefined && this.canFlip();
      return tap && this.hit(p.ray, top.card) ? "flip" : null;
    }
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const dist = horizontal ? Math.abs(dx) : Math.abs(dy);
    if (dist >= SWIPE_MIN_PX && ms <= SWIPE_MAX_MS && dist / ms >= SWIPE_MIN_VELOCITY) {
      if (horizontal) this.swipe(dx < 0 ? -1 : 1, "x");
      else this.swipe(dy < 0 ? 1 : -1, "y");
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
        this.swipe(1);
        return "handled";
      case "ArrowDown":
        this.swipe(-1);
        return "handled";
      case "ArrowRight":
        this.swipe(1, "x");
        return "handled";
      case "ArrowLeft":
        this.swipe(-1, "x");
        return "handled";
    }
    return null;
  }

  private top(): StackCardEntry | undefined {
    return this.pile.find((e) => e.slot === 0);
  }

  private swipe(direction: 1 | -1, axis: SwipeAxis = "y"): void {
    if (this.pulling) return;
    this.animator.swipe(this.pile, direction, performance.now() / 1000, this.options.once, axis);
  }

  private async pullBack(index: number): Promise<void> {
    const bottom = this.pile.find((e) => e.slot === this.pile.length - 1);
    if (!bottom) return;
    const gen = this.generation;
    this.pulling = true;
    await this.reassign(bottom, index);
    this.pulling = false;
    if (gen !== this.generation) return;
    if (!this.pile.includes(bottom) || bottom.index !== index) {
      void this.build(index);
      return;
    }
    const n = this.entries.length;
    // The window of cards the pile shows has moved back by one.
    if (n > STACK_COUNT) this.next = (this.next - 1 + n) % n;
    this.animator.swipeBack(this.pile, 1, performance.now() / 1000);
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
    const ready: Array<{ index: number; loaded: LoadedCard }> = [];
    results.forEach((result, k) => {
      const i = indices[k];
      if (result.status === "fulfilled" && gen === this.generation) {
        ready.push({ index: i, loaded: result.value });
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
    ready.forEach(({ index: i, loaded }, slot) => {
      const card = buildCardObject(
        loaded.textures,
        cardH,
        RARITY_SHADER[this.entries[i].rarity],
        loaded.fx,
      );
      const rest = stackRest(slot, cardH, this.dims);
      card.group.position.set(rest.x, rest.y, rest.z);
      card.group.visible = false;
      this.env.scene.add(card.group);
      const rarity = this.entries[i].rarity;
      this.fx?.attach(card, rarity);
      // Staggered intro: bottom card pops first, top card last. A pack's cards leave it as one
      // deck, a hair apart, so the top card hides the others' faces.
      const stagger = this.options.reveal ? STACK_INTRO_DELAY * 0.25 : STACK_INTRO_DELAY;
      const intro = this.env.reducedMotion
        ? null
        : { startTime: now, delay: (ready.length - 1 - slot) * stagger };
      this.pile.push({ slot, index: i, card, intro, rarity });
    });
    const top = this.topIndex();
    if (top !== null) this.callbacks.onFocus(top);
  }

  /** Point a pile card at a different manifest card by swapping its textures. */
  private async reassign(entry: StackCardEntry, index: number): Promise<void> {
    if (entry.index === index) return;
    const gen = this.generation;
    let loaded: LoadedCard;
    try {
      loaded = await this.acquire(index);
    } catch (err) {
      this.releaseTextures(index);
      if (gen === this.generation && this.pile.includes(entry)) {
        // Rather than keep showing a card the user has already passed, drop it from the pile.
        console.warn(`[cards] stack card ${this.entries[index].id} skipped:`, err);
        this.remove(entry);
      }
      return;
    }
    if (gen !== this.generation || !this.pile.includes(entry)) {
      this.releaseTextures(index);
      return;
    }
    setCardTextures(
      entry.card,
      loaded.textures,
      RARITY_SHADER[this.entries[index].rarity],
      loaded.fx,
    );
    this.releaseTextures(entry.index);
    entry.index = index;
  }

  private remove(entry: StackCardEntry): void {
    this.fx?.detach(entry.card);
    disposeCardObject(entry.card);
    this.releaseTextures(entry.index);
    this.pile = this.pile.filter((e) => e !== entry);
    for (const e of this.pile) if (e.slot > entry.slot) e.slot--;
  }

  private acquire(index: number): Promise<LoadedCard> {
    return acquireCardTextures(this.env, this.entries[index]);
  }

  private releaseTextures(index: number): void {
    releaseCardTextures(this.env, this.entries[index]);
  }

  private clear(): void {
    for (const e of this.pile) {
      this.fx?.detach(e.card);
      disposeCardObject(e.card);
      this.releaseTextures(e.index);
    }
    this.pile = [];
    this.wheelAcc = 0;
    this.pulling = false;
    this.animator.reset();
  }

  private hit(ray: Raycaster, card: CardObject): boolean {
    return card.group.visible && ray.intersectObject(card.mesh, false).length > 0;
  }
}
