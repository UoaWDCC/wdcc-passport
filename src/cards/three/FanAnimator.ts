import type { SceneDims } from "../types";
import { CARD_ASPECT, setCardRenderOrder, type CardObject } from "./buildCard";
import {
  FAN_COUNT,
  FAN_INTRO_DURATION,
  fanHover,
  fanIntro,
  fanRest,
  type FanState,
} from "./FanLayoutBuilder";
import type { Transform } from "./Tween";

export interface TiltState {
  rotateX: number;
  rotateY: number;
}

export interface FanCardEntry {
  index: number;
  card: CardObject;
  /** 0 = rest, 1 = hover peek (lerped). */
  lift: number;
  intro: { startTime: number; delay: number } | null;
}

export interface FanTickContext {
  scrollPos: number;
  cardH: number;
  dims: SceneDims;
  hovered: number | null;
  tilt: TiltState;
  /** Current flip angle (rad) of the zoomed card. */
  flipAngle: number;
  /** Fraction of scroll velocity, rotates the hand as it moves. */
  scrollTilt: number;
  /** Zoomed pose. */
  target: Transform;
}

interface ZoomIn {
  index: number;
  startTime: number;
  start: FanState;
  mid: { x: number; y: number; z: number };
}
interface ZoomOut {
  index: number;
  startTime: number;
  start: { x: number; y: number; z: number; rotY: number; scale: number };
}

const FAN_ZOOM_DURATION = 1.2;
/** Fraction of the zoom duration spent on the initial slide-out phase. */
const SLIDE_PHASE = 0.25;

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Fan mode animation (pokebox FanAnimator): staggered intro pop-up, hover peek,
 * two-phase zoom-in (slide out of the hand, then spin + zoom to the centre), the
 * reverse zoom-out, and the zoomed rest pose with tilt.
 */
export class FanAnimator {
  private zoomIn: ZoomIn | null = null;
  private zoomOut: ZoomOut | null = null;
  private _zoomedIndex: number | null = null;

  get zoomedIndex(): number | null {
    return this._zoomedIndex;
  }
  get isZooming(): boolean {
    return this.zoomIn !== null || this.zoomOut !== null;
  }
  /** Index of the card that is zoomed or mid-transition. */
  get focusedIndex(): number | null {
    return this.zoomIn?.index ?? this.zoomOut?.index ?? this._zoomedIndex;
  }

  reset(): void {
    this.zoomIn = null;
    this.zoomOut = null;
    this._zoomedIndex = null;
  }

  startZoom(entry: FanCardEntry, now: number, dims: SceneDims): void {
    if (this.isZooming || this._zoomedIndex !== null) return;
    const g = entry.card.group;
    // Slide-out waypoint: move card left by ~15% of screen width, and lift it toward the
    // viewer so it sits in front of the whole hand (the right-hand cards are the front-most).
    const slideX = dims.screenW * 0.15;
    const frontZ = fanRest((FAN_COUNT - 1) / 2, g.scale.x, dims).z;
    const lift = Math.max(frontZ, g.position.z) + g.scale.x * CARD_ASPECT * 0.3 - g.position.z;
    this.zoomIn = {
      index: entry.index,
      startTime: now,
      start: {
        x: g.position.x,
        y: g.position.y,
        z: g.position.z,
        rotZ: g.rotation.z,
        scale: g.scale.x,
      },
      mid: { x: g.position.x - slideX, y: g.position.y, z: g.position.z + lift },
    };
    entry.lift = 0;
    setCardRenderOrder(entry.card, 200);
  }

  startReturn(entry: FanCardEntry, now: number): void {
    if (this.isZooming || this._zoomedIndex !== entry.index) return;
    const g = entry.card.group;
    this.zoomOut = {
      index: entry.index,
      startTime: now,
      start: {
        x: g.position.x,
        y: g.position.y,
        z: g.position.z,
        rotY: g.rotation.y,
        scale: g.scale.x,
      },
    };
  }

  tick(entries: Map<number, FanCardEntry>, now: number, dt: number, ctx: FanTickContext): void {
    const peekSpeed = 1 - Math.pow(0.001, dt);
    const focused = this.focusedIndex;
    const { tilt } = ctx;

    for (const entry of entries.values()) {
      if (entry.index === focused) continue;
      const g = entry.card.group;
      const rest = fanRest(entry.index - ctx.scrollPos, ctx.cardH, ctx.dims);
      g.visible = rest.visible;
      if (!rest.visible) continue;

      // Staggered intro: ease-out back from below the pivot (overshoots slightly, then settles).
      if (entry.intro) {
        const elapsed = now - entry.intro.startTime - entry.intro.delay;
        const from = fanIntro(ctx.cardH, ctx.dims);
        const t = elapsed < 0 ? 0 : Math.min(elapsed / FAN_INTRO_DURATION, 1);
        const e = t <= 0 ? 0 : easeOutBack(t);
        g.position.set(
          from.x + (rest.x - from.x) * e,
          from.y + (rest.y - from.y) * e,
          from.z + (rest.z - from.z) * e,
        );
        g.rotation.set(
          tilt.rotateX * 0.5 * e,
          tilt.rotateY * 0.3 * e,
          from.rotZ + (rest.rotZ - from.rotZ) * e,
        );
        g.scale.setScalar(from.scale + (rest.scale - from.scale) * e);
        if (t >= 1) entry.intro = null;
        continue;
      }

      // Hover peek: lerp between rest and hover poses.
      const hovered = entry.index === ctx.hovered && focused === null;
      entry.lift += ((hovered ? 1 : 0) - entry.lift) * peekSpeed;
      const hover = fanHover(rest, ctx.cardH);
      const l = entry.lift;
      g.position.set(
        rest.x + (hover.x - rest.x) * l,
        rest.y + (hover.y - rest.y) * l,
        rest.z + (hover.z - rest.z) * l,
      );
      // Gentle tilt on x/y (pokebox: 0.5 / 0.3 of the tilt), plus a little scroll swing.
      g.rotation.set(
        tilt.rotateX * 0.5,
        tilt.rotateY * 0.3 + ctx.scrollTilt * 0.18,
        rest.rotZ + (hover.rotZ - rest.rotZ) * l,
      );
      g.scale.setScalar(rest.scale + (hover.scale - rest.scale) * l);
      setCardRenderOrder(entry.card, hovered ? 100 : 0);
    }

    // ── Fan zoom-in (two phases: slide-out, then spin+zoom) ──
    if (this.zoomIn) {
      const z = this.zoomIn;
      const entry = entries.get(z.index);
      if (!entry) {
        this.zoomIn = null;
      } else {
        const g = entry.card.group;
        g.visible = true;
        const raw = Math.min((now - z.startTime) / FAN_ZOOM_DURATION, 1);
        const target = ctx.target;
        if (raw <= SLIDE_PHASE) {
          // Phase 1: slide card left to the midpoint, flattening the fan tilt
          const e = easeOutQuad(raw / SLIDE_PHASE);
          g.position.set(
            z.start.x + (z.mid.x - z.start.x) * e,
            z.start.y,
            z.start.z + (z.mid.z - z.start.z) * e,
          );
          g.rotation.set(0, 0, z.start.rotZ * (1 - e));
          g.scale.setScalar(z.start.scale);
        } else {
          // Phase 2: spin + zoom from midpoint to centre target. The card swings half its
          // (growing) width behind itself while spinning, so bump it toward the viewer by
          // that much at mid-spin and settle back as the spin finishes.
          const e = easeInOutCubic((raw - SLIDE_PHASE) / (1 - SLIDE_PHASE));
          const bump = Math.sin(e * Math.PI) * (target.scale * CARD_ASPECT * 0.5 + 1);
          g.position.set(
            z.mid.x + (target.x - z.mid.x) * e,
            z.mid.y + (target.y - z.mid.y) * e,
            z.mid.z + (target.z - z.mid.z) * e + bump,
          );
          g.rotation.set(0, e * Math.PI * 2, 0);
          g.scale.setScalar(z.start.scale + (target.scale - z.start.scale) * e);
        }
        if (raw >= 1) {
          this._zoomedIndex = z.index;
          this.zoomIn = null;
        }
      }
    }

    // ── Fan zoom-out (spin to mid, then slide right into the fan) ──
    if (this.zoomOut) {
      const z = this.zoomOut;
      const entry = entries.get(z.index);
      if (!entry) {
        this.zoomOut = null;
        this._zoomedIndex = null;
      } else {
        const g = entry.card.group;
        const rest = fanRest(entry.index - ctx.scrollPos, ctx.cardH, ctx.dims);
        const mid = { x: rest.x - ctx.dims.screenW * 0.15, y: rest.y, z: rest.z };
        const raw = Math.min((now - z.startTime) / FAN_ZOOM_DURATION, 1);
        const spinPhase = 1 - SLIDE_PHASE;
        if (raw <= spinPhase) {
          const e = easeInOutCubic(raw / spinPhase);
          g.position.set(
            z.start.x + (mid.x - z.start.x) * e,
            z.start.y + (mid.y - z.start.y) * e,
            z.start.z + (mid.z - z.start.z) * e,
          );
          g.rotation.set(0, z.start.rotY * (1 - e) - e * Math.PI * 2, 0);
          g.scale.setScalar(z.start.scale + (rest.scale - z.start.scale) * e);
        } else {
          const p = (raw - spinPhase) / (1 - spinPhase);
          const e = p * p; // ease-in quad for a settling feel
          g.position.set(
            mid.x + (rest.x - mid.x) * e,
            mid.y + (rest.y - mid.y) * e,
            mid.z + (rest.z - mid.z) * e,
          );
          g.rotation.set(0, 0, rest.rotZ * e);
          g.scale.setScalar(rest.scale);
        }
        if (raw >= 1) {
          this.zoomOut = null;
          this._zoomedIndex = null;
          entry.lift = 0;
          setCardRenderOrder(entry.card, 0);
        }
      }
    }

    // ── Zoomed rest: held at the centre with full tilt, flippable ──
    if (this._zoomedIndex !== null && !this.isZooming) {
      const entry = entries.get(this._zoomedIndex);
      if (!entry) {
        this._zoomedIndex = null;
      } else {
        const g = entry.card.group;
        const t = ctx.target;
        g.visible = true;
        g.position.set(t.x, t.y, t.z);
        g.rotation.set(tilt.rotateX, tilt.rotateY + ctx.flipAngle, 0);
        g.scale.setScalar(t.scale);
      }
    }
  }
}
