import { MAX_TILT, SpringValue } from "./SpringValue";

/**
 * Pointer position over the canvas -> spring-damped card rotation (pokebox
 * useMouseTilt). Hovering the top tilts the top toward the viewer, hovering the
 * left tilts the left toward the viewer. Eases back to flat on pointer leave.
 */
export class PointerTilt {
  /** Current rotations in radians. */
  rotateX = 0;
  rotateY = 0;
  hovering = false;

  private readonly springX = new SpringValue(0);
  private readonly springY = new SpringValue(0);
  private el: HTMLElement | null = null;

  /** Normalised tilt for the shader: +x = pointer right, +y = pointer up (-1..1). */
  get x(): number {
    return Math.max(-1, Math.min(1, -this.rotateY / MAX_TILT));
  }
  get y(): number {
    return Math.max(-1, Math.min(1, this.rotateX / MAX_TILT));
  }

  private readonly onMove = (e: PointerEvent): void => {
    if (!this.el) return;
    const rect = this.el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = 1 - (e.clientY - rect.top) / rect.height; // Y-flipped for GL
    this.springX.target = (ny - 0.5) * MAX_TILT * 2;
    this.springY.target = -(nx - 0.5) * MAX_TILT * 2;
    this.hovering = true;
  };

  private readonly onLeave = (): void => {
    this.springX.target = 0;
    this.springY.target = 0;
    this.hovering = false;
  };

  attach(el: HTMLElement): void {
    this.el = el;
    el.addEventListener("pointermove", this.onMove);
    el.addEventListener("pointerleave", this.onLeave);
  }

  detach(): void {
    this.el?.removeEventListener("pointermove", this.onMove);
    this.el?.removeEventListener("pointerleave", this.onLeave);
    this.el = null;
  }

  update(dt: number): void {
    this.springX.update(dt);
    this.springY.update(dt);
    this.rotateX = this.springX.position;
    this.rotateY = this.springY.position;
  }
}
