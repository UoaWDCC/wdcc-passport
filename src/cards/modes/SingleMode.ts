import { RARITY_SHADER } from "../shaders";
import { buildCardObject, disposeCardObject, type CardObject } from "../three/buildCard";
import { acquireCardTextures, cardTextureUrls, releaseCardTextures } from "../three/cardTextures";
import { swipeFlyOff, type SwipeAxis } from "../three/layout";
import { easeInOutCubic, SWIPE_DURATION } from "../three/StackAnimator";
import { STACK_Z_STEP } from "../three/StackLayoutBuilder";
import type { CardEntry } from "../types";
import type { Mode, ModeEnv, PointerInfo, TickContext } from "./Mode";

export type CardStatus =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "error"; message: string };

export interface SingleCallbacks {
  /** Load progress of the card most recently passed to `show`. */
  onStatus(status: CardStatus): void;
  /** The user swiped or pressed an arrow key: +1 = next card, -1 = previous. */
  onStep(delta: number): void;
}

/** Pointer travel / duration beyond which a press is no longer a click. */
const CLICK_MAX_PX = 8;
const CLICK_MAX_MS = 500;
/** Pointer travel along the dominant axis that counts as a swipe. */
const SWIPE_MIN_PX = 50;
const SWIPE_MAX_MS = 500;
const ENTER_FROM = 0.85;

interface Leaving {
  card: CardObject;
  entry: CardEntry;
  axis: SwipeAxis;
  direction: 1 | -1;
  start: number;
}

/**
 * One card at a time. `show` swaps in a card and `preload` keeps neighbours'
 * textures warm; a horizontal swipe or arrow key asks the owner to step.
 */
export class SingleMode implements Mode {
  /** Bumped on every `show` so a load that finishes late is discarded. */
  private generation = 0;
  private card: CardObject | null = null;
  private cardEntry: CardEntry | null = null;
  /** Texture URLs kept loaded by `preload`. */
  private warm = new Set<string>();
  private pointerDownAt: { x: number; y: number; t: number } | null = null;
  private leaving: Leaving | null = null;
  private exit: { axis: SwipeAxis; direction: 1 | -1 } | null = null;
  private enterStart: number | null = null;

  constructor(
    private readonly env: ModeEnv,
    private readonly callbacks: SingleCallbacks,
  ) {}

  dispose(): void {
    this.generation++;
    this.finishLeaving();
    this.clearCard();
    for (const url of this.warm) this.env.textures.release(url);
    this.warm.clear();
  }

  /** Replaces the current card. A previous `show` still loading is discarded. */
  async show(entry: CardEntry): Promise<void> {
    const gen = ++this.generation;
    this.retireCard();
    this.callbacks.onStatus({ kind: "loading" });

    let loaded;
    try {
      loaded = await acquireCardTextures(this.env, entry);
    } catch (err) {
      releaseCardTextures(this.env, entry);
      if (gen === this.generation) {
        const message = err instanceof Error ? err.message : String(err);
        this.callbacks.onStatus({ kind: "error", message });
      }
      return;
    }
    if (gen !== this.generation) {
      // Another card was requested (or the mode was disposed) while loading.
      releaseCardTextures(this.env, entry);
      return;
    }
    this.cardEntry = entry;
    this.card = buildCardObject(loaded.textures, 1, RARITY_SHADER[entry.rarity], loaded.fx);
    this.env.scene.add(this.card.group);
    this.enterStart = this.leaving ? performance.now() / 1000 : null;
    this.callbacks.onStatus({ kind: "ready" });
  }

  /**
   * Keeps the textures of these cards loaded so a later `show` of any of them is
   * instant. Cards dropped from the list since the previous call are released.
   */
  preload(entries: readonly CardEntry[]): void {
    const wanted = new Set(entries.flatMap(cardTextureUrls));
    for (const url of this.warm) if (!wanted.has(url)) this.env.textures.release(url);
    for (const url of wanted) {
      // Failures surface when the card is actually shown.
      if (!this.warm.has(url)) this.env.textures.acquire(url).catch(() => {});
    }
    this.warm = wanted;
  }

  canFlip(): boolean {
    return this.card !== null;
  }

  cards(): CardObject[] {
    const cards: CardObject[] = [];
    if (this.card) cards.push(this.card);
    if (this.leaving) cards.push(this.leaving.card);
    return cards;
  }

  tick(ctx: TickContext): void {
    const leaving = this.leaving;
    if (leaving) {
      const raw = Math.min((ctx.now - leaving.start) / SWIPE_DURATION, 1);
      if (raw >= 1) {
        this.finishLeaving();
      } else {
        // Same flight as a stack swipe: held in front of the incoming card, shrinking as it goes.
        const k = easeInOutCubic(raw);
        const fly = swipeFlyOff(leaving.axis, ctx.singleHeight, ctx.dims) * leaving.direction * k;
        const lg = leaving.card.group;
        lg.position.set(
          leaving.axis === "x" ? fly : 0,
          leaving.axis === "y" ? fly : 0,
          ctx.dims.boxD * STACK_Z_STEP * 2,
        );
        lg.rotation.set(0, 0, 0);
        lg.scale.setScalar(ctx.singleHeight * (1 - k * 0.3));
      }
    }
    if (!this.card) return;
    const g = this.card.group;
    let grow = 1;
    if (this.enterStart !== null) {
      const raw = Math.min((ctx.now - this.enterStart) / SWIPE_DURATION, 1);
      grow = ENTER_FROM + (1 - ENTER_FROM) * easeInOutCubic(raw);
      if (raw >= 1) this.enterStart = null;
    }
    g.scale.setScalar(ctx.singleHeight * grow);
    g.rotation.set(ctx.tilt.rotateX, ctx.tilt.rotateY + ctx.flipAngle, 0);
  }

  pointerDown(p: PointerInfo): void {
    this.pointerDownAt = { x: p.x, y: p.y, t: p.t };
  }

  pointerMove(): boolean {
    return false;
  }

  pointerCancel(): void {
    this.pointerDownAt = null;
  }

  pointerLeave(): void {}

  pointerUp(p: PointerInfo): "flip" | null {
    const down = this.pointerDownAt;
    this.pointerDownAt = null;
    if (!down) return null;
    const dx = p.x - down.x;
    const dy = p.y - down.y;
    const ms = (p.t - down.t) * 1000;
    if (ms > Math.max(CLICK_MAX_MS, SWIPE_MAX_MS)) return null;

    const horizontal = Math.abs(dx) > Math.abs(dy);
    if ((horizontal ? Math.abs(dx) : Math.abs(dy)) >= SWIPE_MIN_PX) {
      if (horizontal) this.step("x", dx < 0 ? -1 : 1);
      else this.step("y", dy < 0 ? 1 : -1);
      return null;
    }
    if (Math.hypot(dx, dy) <= CLICK_MAX_PX && ms <= CLICK_MAX_MS && this.card) {
      const hit = p.ray.intersectObject(this.card.mesh, false).length > 0;
      if (hit) return "flip";
    }
    return null;
  }

  wheel(): void {}

  key(key: string): "flip" | "handled" | null {
    switch (key) {
      case "Enter":
      case " ":
        return this.card ? "flip" : "handled";
      case "ArrowRight":
        this.step("x", -1);
        return "handled";
      case "ArrowLeft":
        this.step("x", 1);
        return "handled";
    }
    return null;
  }

  private step(axis: SwipeAxis, direction: 1 | -1): void {
    if (this.card) this.exit = { axis, direction };
    this.callbacks.onStep(axis === "x" ? -direction : direction);
  }

  private retireCard(): void {
    this.finishLeaving();
    const exit = this.exit;
    this.exit = null;
    if (exit && this.card && this.cardEntry && !this.env.reducedMotion) {
      this.leaving = {
        ...exit,
        card: this.card,
        entry: this.cardEntry,
        start: performance.now() / 1000,
      };
      this.card = null;
      this.cardEntry = null;
      return;
    }
    this.clearCard();
  }

  private finishLeaving(): void {
    if (!this.leaving) return;
    disposeCardObject(this.leaving.card);
    releaseCardTextures(this.env, this.leaving.entry);
    this.leaving = null;
  }

  /** Removes the current card and releases its textures back to the cache. */
  private clearCard(): void {
    if (this.card) disposeCardObject(this.card);
    this.card = null;
    if (this.cardEntry) releaseCardTextures(this.env, this.cardEntry);
    this.cardEntry = null;
  }
}
