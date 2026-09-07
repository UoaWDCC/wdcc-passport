import type { SceneDims } from "../types";
import { setCardRenderOrder, type CardObject } from "./buildCard";
import type { TiltState } from "./FanAnimator";
import { CARD_ASPECT } from "./buildCard";
import { STACK_INTRO_DURATION, stackIntro, stackRest } from "./StackLayoutBuilder";

export interface StackCardEntry {
  /** 0 = top of the pile. */
  slot: number;
  /** Manifest index currently shown by this card object. */
  index: number;
  card: CardObject;
  intro: { startTime: number; delay: number } | null;
}

export interface StackTickContext {
  cardH: number;
  dims: SceneDims;
  tilt: TiltState;
  flipAngle: number;
}

interface Swipe {
  /** +1 = swipe up, -1 = swipe down. The top card always flies off and goes to the bottom. */
  direction: 1 | -1;
  startTime: number;
  departing: StackCardEntry;
}

const SWIPE_DURATION = 0.45;

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Stack mode animation (pokebox StackAnimator): staggered intro, swipe
 * transitions (top card flies off, everyone else promotes one slot, departed card
 * snaps to the bottom) and steady-state settling with tilt.
 */
export class StackAnimator {
  private swipeState: Swipe | null = null;

  get isSwiping(): boolean {
    return this.swipeState !== null;
  }

  reset(): void {
    this.swipeState = null;
  }

  isIntroPlaying(entries: StackCardEntry[]): boolean {
    return entries.some((e) => e.intro);
  }

  /** Start a swipe. Always swipes the top card (slot 0). Returns false if busy. */
  swipe(entries: StackCardEntry[], direction: 1 | -1, now: number): boolean {
    if (this.swipeState || entries.length < 2 || this.isIntroPlaying(entries)) return false;
    const departing = entries.find((e) => e.slot === 0);
    if (!departing) return false;
    this.swipeState = { direction, startTime: now, departing };
    setCardRenderOrder(departing.card, 200);
    return true;
  }

  /**
   * Animate the pile. Returns the card that just landed at the bottom when a
   * swipe completes this frame (so the caller can re-point it at another card).
   */
  tick(
    entries: StackCardEntry[],
    now: number,
    dt: number,
    ctx: StackTickContext,
  ): StackCardEntry | null {
    const n = entries.length;
    if (n === 0) return null;
    const { tilt } = ctx;
    let completed: StackCardEntry | null = null;

    // ── Staggered intro animation ──
    for (const entry of entries) {
      if (!entry.intro) continue;
      const g = entry.card.group;
      const rest = stackRest(entry.slot, ctx.cardH, ctx.dims);
      const from = stackIntro(ctx.cardH, ctx.dims);
      const elapsed = now - entry.intro.startTime - entry.intro.delay;
      const t = elapsed < 0 ? 0 : Math.min(elapsed / STACK_INTRO_DURATION, 1);
      const e = t <= 0 ? 0 : easeOutBack(t);
      g.visible = true;
      g.position.set(
        from.x + (rest.x - from.x) * e,
        from.y + (rest.y - from.y) * e,
        from.z + (rest.z - from.z) * e,
      );
      g.rotation.set(tilt.rotateX * 0.5 * e, tilt.rotateY * 0.3 * e, 0);
      g.scale.setScalar(from.scale + (rest.scale - from.scale) * e);
      if (t >= 1) entry.intro = null;
    }

    // ── Swipe transition ──
    if (this.swipeState) {
      const s = this.swipeState;
      const raw = Math.min((now - s.startTime) / SWIPE_DURATION, 1);
      const e = easeInOutCubic(raw);
      const flyOffY = ctx.cardH * 1.5 * s.direction;

      const departing = s.departing;
      const rest = stackRest(0, ctx.cardH, ctx.dims);
      const g = departing.card.group;
      g.position.set(rest.x, rest.y + flyOffY * e, rest.z);
      g.rotation.set(0, 0, 0);
      g.scale.setScalar(rest.scale * (1 - e * 0.3));

      // Remaining cards shift toward their promoted positions
      for (const entry of entries) {
        if (entry === departing) continue;
        const from = stackRest(entry.slot, ctx.cardH, ctx.dims);
        const to = stackRest(Math.max(0, entry.slot - 1), ctx.cardH, ctx.dims);
        const eg = entry.card.group;
        eg.position.set(
          from.x + (to.x - from.x) * e,
          from.y + (to.y - from.y) * e,
          from.z + (to.z - from.z) * e,
        );
        eg.scale.setScalar(from.scale + (to.scale - from.scale) * e);
      }

      if (raw >= 1) {
        // Reorder: departed card goes to the bottom, everyone else moves up one slot
        for (const entry of entries) entry.slot = entry === departing ? n - 1 : entry.slot - 1;
        const bottom = stackRest(departing.slot, ctx.cardH, ctx.dims);
        g.position.set(bottom.x, bottom.y, bottom.z);
        g.scale.setScalar(bottom.scale);
        setCardRenderOrder(departing.card, 0);
        completed = departing;
        this.swipeState = null;
      }
      return completed;
    }

    // ── Steady state: settle toward rest; top card gets full tilt, lower cards reduced ──
    if (!this.isIntroPlaying(entries)) {
      const lerp = 1 - Math.pow(0.001, dt);
      // While the top card flips it swings half its width through the pile, so lift it
      // toward the viewer by that much (plus a margin) in proportion to the flip.
      const flipLift =
        Math.abs(Math.sin(ctx.flipAngle)) * (ctx.cardH * CARD_ASPECT * 0.5 + ctx.cardH * 0.05);
      for (const entry of entries) {
        const g = entry.card.group;
        const rest = stackRest(entry.slot, ctx.cardH, ctx.dims);
        const targetZ = rest.z + (entry.slot === 0 ? flipLift : 0);
        g.visible = true;
        g.position.x += (rest.x - g.position.x) * lerp;
        g.position.y += (rest.y - g.position.y) * lerp;
        g.position.z += (targetZ - g.position.z) * lerp;
        g.scale.setScalar(g.scale.x + (rest.scale - g.scale.x) * lerp);
        const f = entry.slot === 0 ? 1 : Math.max(0.1, 1 - entry.slot * 0.25);
        const flip = entry.slot === 0 ? ctx.flipAngle : 0;
        g.rotation.set(tilt.rotateX * 0.5 * f, tilt.rotateY * 0.3 * f + flip, 0);
      }
    }
    return null;
  }
}
