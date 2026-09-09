import { buildCardObject, disposeCardObject, type CardObject } from "../three/buildCard";
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
/** Horizontal pointer travel that counts as a swipe (must also beat vertical travel). */
const SWIPE_MIN_PX = 50;
const SWIPE_MAX_MS = 500;

/**
 * One card at a time. `show` swaps in a card and `preload` keeps neighbours'
 * textures warm; a horizontal swipe or arrow key asks the owner to step.
 */
export class SingleMode implements Mode {
  /** Bumped on every `show` so a load that finishes late is discarded. */
  private generation = 0;
  private card: CardObject | null = null;
  private cardUrls: { front: string; back: string } | null = null;
  /** Texture URLs kept loaded by `preload`. */
  private warm = new Set<string>();
  private pointerDownAt: { x: number; y: number; t: number } | null = null;

  constructor(
    private readonly env: ModeEnv,
    private readonly callbacks: SingleCallbacks,
  ) {}

  dispose(): void {
    this.generation++;
    this.clearCard();
    for (const url of this.warm) this.env.textures.release(url);
    this.warm.clear();
  }

  /** Replaces the current card. A previous `show` still loading is discarded. */
  async show(entry: CardEntry): Promise<void> {
    const gen = ++this.generation;
    this.clearCard();
    this.callbacks.onStatus({ kind: "loading" });

    const urls = { front: entry.front, back: entry.back };
    let front, back;
    try {
      [front, back] = await Promise.all([
        this.env.textures.acquire(urls.front),
        this.env.textures.acquire(urls.back),
      ]);
    } catch (err) {
      this.env.textures.release(urls.front);
      this.env.textures.release(urls.back);
      if (gen === this.generation) {
        const message = err instanceof Error ? err.message : String(err);
        this.callbacks.onStatus({ kind: "error", message });
      }
      return;
    }
    if (gen !== this.generation) {
      // Another card was requested (or the mode was disposed) while loading.
      this.env.textures.release(urls.front);
      this.env.textures.release(urls.back);
      return;
    }
    this.cardUrls = urls;
    this.card = buildCardObject({ front, back }, 1);
    this.env.scene.add(this.card.group);
    this.callbacks.onStatus({ kind: "ready" });
  }

  /**
   * Keeps the textures of these cards loaded so a later `show` of any of them is
   * instant. Cards dropped from the list since the previous call are released.
   */
  preload(entries: readonly CardEntry[]): void {
    const wanted = new Set(entries.flatMap((e) => [e.front, e.back]));
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

  tick(ctx: TickContext): void {
    if (!this.card) return;
    const g = this.card.group;
    g.scale.setScalar(ctx.singleHeight);
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

    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) {
      // Swipe left (drag content leftwards) = next card.
      this.callbacks.onStep(dx < 0 ? 1 : -1);
      return null;
    }
    if (Math.hypot(dx, dy) <= CLICK_MAX_PX && ms <= CLICK_MAX_MS && this.card) {
      const hit = p.ray.intersectObjects([this.card.front, this.card.back], false).length > 0;
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
        this.callbacks.onStep(1);
        return "handled";
      case "ArrowLeft":
        this.callbacks.onStep(-1);
        return "handled";
    }
    return null;
  }

  /** Removes the current card and releases its textures back to the cache. */
  private clearCard(): void {
    if (this.card) disposeCardObject(this.card);
    this.card = null;
    if (this.cardUrls) {
      this.env.textures.release(this.cardUrls.front);
      this.env.textures.release(this.cardUrls.back);
    }
    this.cardUrls = null;
  }
}
