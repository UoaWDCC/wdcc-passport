export interface Transform {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  scale: number;
}

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/** Minimal transform tween; sample() returns the interpolated transform for a time. */
export class Tween {
  readonly from: Transform;
  readonly to: Transform;
  private readonly start: number;
  private readonly duration: number;
  private readonly ease: (t: number) => number;

  constructor(from: Transform, to: Transform, now: number, duration = 0.5, ease = easeOutCubic) {
    this.from = { ...from };
    this.to = { ...to };
    this.start = now;
    this.duration = duration;
    this.ease = ease;
  }

  progress(now: number): number {
    return Math.min(1, (now - this.start) / this.duration);
  }

  done(now: number): boolean {
    return this.progress(now) >= 1;
  }

  sample(now: number, out: Transform): Transform {
    const e = this.ease(this.progress(now));
    const f = this.from;
    const t = this.to;
    out.x = f.x + (t.x - f.x) * e;
    out.y = f.y + (t.y - f.y) * e;
    out.z = f.z + (t.z - f.z) * e;
    out.rx = f.rx + (t.rx - f.rx) * e;
    out.ry = f.ry + (t.ry - f.ry) * e;
    out.rz = f.rz + (t.rz - f.rz) * e;
    out.scale = f.scale + (t.scale - f.scale) * e;
    return out;
  }
}
