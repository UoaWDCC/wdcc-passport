import type { SceneDims } from "../types";
import { setCardFade, type CardObject } from "./buildCard";
import type { TiltState } from "./FanAnimator";
import { basePosition, singleCardSize } from "./layout";

export interface SingleCardEntry {
  index: number;
  card: CardObject;
}

export interface SingleTickContext {
  dims: SceneDims;
  tilt: TiltState;
  flipAngle: number;
  idleFloat: boolean;
}

const DEPART_DURATION = 0.6;
const ARRIVE_DURATION = 0.5;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * Single mode (pokebox CardNavigator + single-card branch): one card at the base
 * transform with full tilt and an idle float; navigation fades the old card out
 * while pushing it back, and fades the new one in on an independent timeline.
 */
export class SingleAnimator {
  current: SingleCardEntry | null = null;
  private departing: { entry: SingleCardEntry; startZ: number; start: number } | null = null;
  private arriveStart = 0;
  private arriving = false;

  /** Swap in a new card. The previous one departs; returns nothing, the caller disposes departed cards via tick(). */
  navigate(next: SingleCardEntry, now: number, dims: SceneDims): SingleCardEntry | null {
    const finished = this.finalizeDeparting();
    if (this.current) {
      setCardFade(this.current.card, 1);
      this.departing = {
        entry: this.current,
        startZ: this.current.card.group.position.z,
        start: now,
      };
    }
    this.current = next;
    const base = basePosition(dims);
    next.card.group.position.set(base.x, base.y, base.z);
    next.card.group.scale.setScalar(dims.screenH * singleCardSize(dims));
    setCardFade(next.card, 0);
    this.arriveStart = now;
    this.arriving = true;
    return finished;
  }

  private finalizeDeparting(): SingleCardEntry | null {
    const d = this.departing;
    this.departing = null;
    return d ? d.entry : null;
  }

  /** Returns a departed card that finished fading out (to dispose), if any. */
  tick(now: number, ctx: SingleTickContext): SingleCardEntry | null {
    let finished: SingleCardEntry | null = null;

    if (this.departing) {
      const d = this.departing;
      const t = Math.min((now - d.start) / DEPART_DURATION, 1);
      const e = easeOutCubic(t);
      setCardFade(d.entry.card, 1 - e);
      d.entry.card.group.position.z = d.startZ - e * ctx.dims.boxD * 0.25;
      if (t >= 1) finished = this.finalizeDeparting();
    }

    const cur = this.current;
    if (cur) {
      const g = cur.card.group;
      const base = basePosition(ctx.dims);
      g.position.set(base.x, base.y, base.z);
      g.scale.setScalar(ctx.dims.screenH * singleCardSize(ctx.dims));
      g.rotation.set(ctx.tilt.rotateX, ctx.tilt.rotateY + ctx.flipAngle, 0);
      if (ctx.idleFloat) {
        g.rotation.y += Math.sin(now * 0.7) * 0.14;
        g.rotation.x += Math.sin(now * 0.9 + 0.5) * 0.025;
        const amp = ctx.dims.screenH * 0.012;
        g.position.x += Math.sin(now * 1.9) * amp * 1.2;
        g.position.y += 1.0 + Math.sin(now * 1.4 + 1.0) * amp;
      }
      if (this.arriving) {
        const t = Math.min((now - this.arriveStart) / ARRIVE_DURATION, 1);
        setCardFade(cur.card, easeInOutSine(t));
        if (t >= 1) this.arriving = false;
      }
    }
    return finished;
  }

  /** Drop everything (mode switch). Returns every card the animator still holds. */
  clear(): SingleCardEntry[] {
    const out: SingleCardEntry[] = [];
    if (this.departing) out.push(this.departing.entry);
    if (this.current) out.push(this.current);
    this.departing = null;
    this.current = null;
    this.arriving = false;
    return out;
  }
}
