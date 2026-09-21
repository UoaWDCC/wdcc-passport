import type { CardRarity, SceneDims } from "../types";
import { setCardRenderOrder, type CardObject } from "./buildCard";
import type { TiltState } from "./FanAnimator";
import { CARD_ASPECT } from "./buildCard";
import { swipeFlyOff, type SwipeAxis } from "./layout";
import {
  STACK_INTRO_DURATION,
  STACK_Z_STEP,
  stackBurst,
  stackIntro,
  stackRest,
} from "./StackLayoutBuilder";

export interface StackCardEntry {
  /** 0 = top of the pile. */
  slot: number;
  /** Manifest index currently shown by this card object. */
  index: number;
  card: CardObject;
  intro: { startTime: number; delay: number } | null;
  /** Reveal mode only, from here down. */
  rarity?: CardRarity;
  /** The card has reached the top of the pile and had its moment (aura lit, sparkles thrown). */
  revealed?: boolean;
  /** Start time (s) of a legendary's charge-up (hidden, trembling) while it plays. */
  charge?: number | null;
  /** Start time (s) of the legendary showcase (lift and spin) while it plays. */
  showcase?: number | null;
  /** The tremble offset applied last frame, so it can be taken back off before easing. */
  shake?: { x: number; y: number };
}

export interface StackTickContext {
  cardH: number;
  dims: SceneDims;
  tilt: TiltState;
  flipAngle: number;
  /** Pack reveal: cards are thrown out of the pack, and each gets its moment on reaching the top. */
  reveal?: boolean;
  reducedMotion?: boolean;
}

interface Swipe {
  direction: 1 | -1;
  axis: SwipeAxis;
  startTime: number;
  moving: StackCardEntry;
  reverse: boolean;
}

export const SWIPE_DURATION = 0.45;
const NO_SHAKE = { x: 0, y: 0 };
/**
 * Fraction of the pointer tilt the pile follows. Every card tilts by the same amount, so the
 * pile moves as one block and the top card keeps covering the faces beneath it (pokebox tilted
 * the top card the most, which swung it clear of the cards below).
 */
const TILT_X = 0.4;
const TILT_Y = 0.25;
/** Legendary reveal: the card lifts off the pile and spins a full turn. */
export const SHOWCASE_DURATION = 1.3;
/** Before the showcase a legendary sits hidden under its cover, trembling harder and harder. */
export const CHARGE_DURATION = 1.1;
/** Point in the showcase (0..1) where the card counts as revealed: the flash and the sparkle burst. */
const SHOWCASE_REVEAL_AT = 0.1;

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Stack mode animation (pokebox StackAnimator): staggered intro, swipe
 * transitions (top card flies off, everyone else promotes one slot, departed card
 * snaps to the bottom) and steady-state settling with tilt.
 */
export class StackAnimator {
  private swipeState: Swipe | null = null;
  private justRevealed: StackCardEntry | null = null;

  /** The card that had its reveal moment during the last tick, if any (read once). */
  takeRevealed(): StackCardEntry | null {
    const entry = this.justRevealed;
    this.justRevealed = null;
    return entry;
  }

  /** A legendary is charging up or mid-showcase. */
  isShowcasing(entries: StackCardEntry[]): boolean {
    return entries.some((e) => e.showcase != null || e.charge != null);
  }

  /** Jump a playing showcase to its settled state. */
  skipShowcase(entries: StackCardEntry[]): void {
    for (const e of entries) {
      if (e.showcase == null && e.charge == null) continue;
      e.showcase = null;
      e.charge = null;
      if (!e.revealed) {
        e.revealed = true;
        this.justRevealed = e;
      }
    }
  }

  /** 0..1 through the charge-up, or null when it is not playing. */
  chargeProgress(entry: StackCardEntry, now: number): number | null {
    if (entry.charge == null) return null;
    return Math.min(1, (now - entry.charge) / CHARGE_DURATION);
  }

  /** 0..1 through the showcase, or null when it is not playing. */
  showcaseProgress(entry: StackCardEntry, now: number): number | null {
    if (entry.showcase == null) return null;
    return Math.min(1, (now - entry.showcase) / SHOWCASE_DURATION);
  }

  get isSwiping(): boolean {
    return this.swipeState !== null;
  }

  reset(): void {
    this.swipeState = null;
    this.justRevealed = null;
  }

  isIntroPlaying(entries: StackCardEntry[]): boolean {
    return entries.some((e) => e.intro);
  }

  /**
   * Start a swipe. Always swipes the top card (slot 0). Returns false if busy.
   * A lone card only swipes when `allowLast` is set (it is being removed, not recycled).
   */
  swipe(
    entries: StackCardEntry[],
    direction: 1 | -1,
    now: number,
    allowLast = false,
    axis: SwipeAxis = "y",
  ): boolean {
    const minPile = allowLast ? 1 : 2;
    if (this.swipeState || entries.length < minPile || this.isIntroPlaying(entries)) return false;
    if (this.isShowcasing(entries)) return false;
    const moving = entries.find((e) => e.slot === 0);
    if (!moving) return false;
    this.swipeState = { direction, axis, startTime: now, moving, reverse: false };
    setCardRenderOrder(moving.card, 200);
    return true;
  }

  swipeBack(entries: StackCardEntry[], direction: 1 | -1, now: number): boolean {
    if (this.swipeState || entries.length < 2 || this.isIntroPlaying(entries)) return false;
    if (this.isShowcasing(entries)) return false;
    const moving = entries.find((e) => e.slot === entries.length - 1);
    if (!moving) return false;
    this.swipeState = { direction, axis: "y", startTime: now, moving, reverse: true };
    setCardRenderOrder(moving.card, 200);
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
      const from = ctx.reveal ? stackBurst(ctx.cardH, ctx.dims) : stackIntro(ctx.cardH, ctx.dims);
      const elapsed = now - entry.intro.startTime - entry.intro.delay;
      const t = elapsed < 0 ? 0 : Math.min(elapsed / STACK_INTRO_DURATION, 1);
      const e = t <= 0 ? 0 : easeOutBack(t);
      // Reveal mode: the cards are thrown up out of the pack mouth as one deck, tumbling together,
      // so only the top card's face is ever seen; the rest stay hidden behind it.
      const arc = ctx.reveal ? Math.sin(Math.PI * t) * ctx.cardH * 0.22 : 0;
      const tumble = ctx.reveal ? -0.5 * (1 - e) : 0;
      // Keep the deck in pile order from the first frame, so the top card always covers the others.
      const fromZ = ctx.reveal ? from.z - entry.slot * ctx.dims.boxD * 0.01 : from.z;
      g.visible = t > 0 || !ctx.reveal;
      g.position.set(
        from.x + (rest.x - from.x) * e,
        from.y + (rest.y - from.y) * e + arc,
        fromZ + (rest.z - fromZ) * e,
      );
      const flip = entry.slot === 0 ? ctx.flipAngle : 0;
      g.rotation.set(tilt.rotateX * TILT_X * e, tilt.rotateY * TILT_Y * e + flip, tumble);
      g.scale.setScalar(from.scale + (rest.scale - from.scale) * e);
      if (t >= 1) entry.intro = null;
    }

    // ── Swipe transition ──
    if (this.swipeState) {
      const s = this.swipeState;
      const raw = Math.min((now - s.startTime) / SWIPE_DURATION, 1);
      const e = easeInOutCubic(raw);
      const k = s.reverse ? 1 - e : e;
      const fly = swipeFlyOff(s.axis, ctx.cardH, ctx.dims) * s.direction * k;
      const lift = ctx.dims.boxD * STACK_Z_STEP * 2;

      const moving = s.moving;
      const rest = stackRest(0, ctx.cardH, ctx.dims);
      const g = moving.card.group;
      g.visible = true;
      // Held in front of the pile, so the card promoting into the top slot never passes through it.
      g.position.set(
        rest.x + (s.axis === "x" ? fly : 0),
        rest.y + (s.axis === "y" ? fly : 0),
        rest.z + lift,
      );
      g.rotation.set(0, 0, 0);
      g.scale.setScalar(rest.scale * (1 - k * 0.3));

      // Remaining cards shift one slot: up on a forward swipe, down on a pull-back.
      for (const entry of entries) {
        if (entry === moving) continue;
        const from = stackRest(entry.slot, ctx.cardH, ctx.dims);
        const toSlot = s.reverse ? entry.slot + 1 : Math.max(0, entry.slot - 1);
        const to = stackRest(toSlot, ctx.cardH, ctx.dims);
        const eg = entry.card.group;
        eg.position.set(
          from.x + (to.x - from.x) * e,
          from.y + (to.y - from.y) * e,
          from.z + (to.z - from.z) * e,
        );
        eg.scale.setScalar(from.scale + (to.scale - from.scale) * e);
      }

      if (raw >= 1) {
        if (s.reverse) {
          for (const entry of entries) entry.slot = entry === moving ? 0 : entry.slot + 1;
          g.position.set(rest.x, rest.y, rest.z);
          g.scale.setScalar(rest.scale);
        } else {
          // Departed card goes to the bottom, everyone else moves up one slot
          for (const entry of entries) entry.slot = entry === moving ? n - 1 : entry.slot - 1;
          const bottom = stackRest(moving.slot, ctx.cardH, ctx.dims);
          g.position.set(bottom.x, bottom.y, bottom.z);
          g.scale.setScalar(bottom.scale);
          completed = moving;
        }
        setCardRenderOrder(moving.card, 0);
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
        const isTop = entry.slot === 0;
        let liftZ = isTop ? flipLift : 0;
        let spin = 0;
        let shakeX = 0;
        let shakeY = 0;
        let shakeRot = 0;

        if (ctx.reveal && isTop && (entry.revealed || Math.cos(ctx.flipAngle) > 0)) {
          // Reaching the top of the pile is a card's reveal. A legendary makes a show of it:
          // it charges up hidden under its cover, trembling harder and harder, then lifts
          // off the pile and spins a full turn as the cover burns away.
          const legendary = entry.rarity === "legendary" && !ctx.reducedMotion;
          if (!entry.revealed && legendary && entry.charge == null && entry.showcase == null) {
            entry.charge = now;
          }
          const c = this.chargeProgress(entry, now);
          if (c !== null) {
            const amp = c * c;
            shakeX = Math.sin(now * 47) * ctx.cardH * 0.012 * amp;
            shakeY = Math.cos(now * 53) * ctx.cardH * 0.009 * amp;
            shakeRot = Math.sin(now * 41) * 0.035 * amp;
            if (c >= 1) {
              entry.charge = null;
              entry.showcase = now;
            }
          }
          const p = this.showcaseProgress(entry, now);
          if (!entry.revealed && (legendary ? p !== null && p >= SHOWCASE_REVEAL_AT : true)) {
            entry.revealed = true;
            this.justRevealed = entry;
          }
          if (p !== null) {
            spin = Math.PI * 2 * easeInOutCubic(p);
            liftZ += Math.sin(Math.PI * p) * ctx.cardH * 0.45;
            if (p >= 1) entry.showcase = null;
          }
        }

        const targetZ = rest.z + liftZ;
        g.visible = true;
        // Ease the un-shaken position toward rest, then lay this frame's tremble on top;
        // easing the tremble itself would smooth it away.
        const prev = entry.shake ?? NO_SHAKE;
        const baseX = g.position.x - prev.x;
        const baseY = g.position.y - prev.y;
        g.position.x = baseX + (rest.x - baseX) * lerp + shakeX;
        g.position.y = baseY + (rest.y - baseY) * lerp + shakeY;
        entry.shake = shakeX || shakeY ? { x: shakeX, y: shakeY } : NO_SHAKE;

        g.position.z += (targetZ - g.position.z) * lerp;
        g.scale.setScalar(g.scale.x + (rest.scale - g.scale.x) * lerp);
        const flip = isTop ? ctx.flipAngle : 0;
        g.rotation.set(tilt.rotateX * TILT_X, tilt.rotateY * TILT_Y + flip + spin, shakeRot);
      }
    }
    return null;
  }
}
