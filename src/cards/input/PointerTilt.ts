import { MAX_TILT, SpringValue } from "./SpringValue";

/**
 * Pointer position over an element -> spring-damped card rotation (pokebox
 * useMouseTilt). Hovering the top tilts the top toward the viewer, hovering the
 * left tilts the left toward the viewer. Eases back to flat when the pointer leaves
 * (or, for touch/pen, when it lifts).
 */
export class PointerTilt {
  /** Current rotations in radians. */
  rotateX = 0;
  rotateY = 0;

  private readonly springX = new SpringValue(0);
  private readonly springY = new SpringValue(0);
  private el: HTMLElement | null = null;

  private readonly onMove = (e: PointerEvent): void => {
    if (!this.el) return;
    const rect = this.el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = 1 - (e.clientY - rect.top) / rect.height;
    this.springX.target = (ny - 0.5) * MAX_TILT * 2;
    this.springY.target = -(nx - 0.5) * MAX_TILT * 2;
  };

  private readonly onLeave = (): void => {
    this.springX.target = 0;
    this.springY.target = 0;
  };

  private readonly onUp = (e: PointerEvent): void => {
    if (e.pointerType !== "mouse") this.onLeave();
  };

  attach(el: HTMLElement): void {
    this.el = el;
    el.addEventListener("pointermove", this.onMove);
    el.addEventListener("pointerleave", this.onLeave);
    el.addEventListener("pointerup", this.onUp);
    el.addEventListener("pointercancel", this.onUp);
  }

  detach(): void {
    this.el?.removeEventListener("pointermove", this.onMove);
    this.el?.removeEventListener("pointerleave", this.onLeave);
    this.el?.removeEventListener("pointerup", this.onUp);
    this.el?.removeEventListener("pointercancel", this.onUp);
    this.el = null;
  }

  update(dt: number): void {
    this.springX.update(dt);
    this.springY.update(dt);
    this.rotateX = this.springX.position;
    this.rotateY = this.springY.position;
  }
}
