import { Quaternion, ShaderMaterial, Vector2, Vector3 } from "three";
import { CARD_ASPECT, type CardObject } from "./buildCard";

const eye = new Vector3();
const cardPos = new Vector3();
const dir = new Vector3();
const right = new Vector3();
const up = new Vector3();
const rotation = new Quaternion();
const scale = new Vector3();

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * pokebox ShaderUniformUpdater: the viewer's eye is projected onto each card to get
 * the "pointer" the shaders shine towards. The eye is fixed straight in front of the
 * screen (no head tracking), so the highlight moves with the card's own tilt and
 * fan rotation, as pokebox does with its mouse tilt.
 */
export function updateCardUniforms(cards: Iterable<CardObject>, time: number, eyeZ: number): void {
  eye.set(0, 0, eyeZ);
  for (const card of cards) {
    const material = card.mesh.material;
    if (!(material instanceof ShaderMaterial)) continue;
    const u = material.uniforms;
    u.uTime.value = time;

    card.group.updateMatrixWorld(true);
    card.mesh.getWorldPosition(cardPos);
    card.mesh.getWorldQuaternion(rotation);
    card.mesh.getWorldScale(scale);
    dir.copy(eye).sub(cardPos);
    right.set(1, 0, 0).applyQuaternion(rotation);
    up.set(0, 1, 0).applyQuaternion(rotation);

    const cardH = scale.y;
    const cardW = scale.x * CARD_ASPECT;
    const px = clamp01(dir.dot(right) / cardW + 0.5);
    const py = clamp01(dir.dot(up) / cardH + 0.5);
    (u.uPointer.value as Vector2).set(px, py);
    (u.uBackground.value as Vector2).set(0.37 + px * 0.26, 0.37 + py * 0.26);
    u.uPointerFromCenter.value = Math.min(Math.hypot(px - 0.5, py - 0.5) * 2, 1);
    u.uPointerFromLeft.value = px;
    u.uPointerFromTop.value = py;
    u.uRotateX.value = card.group.rotation.y * (180 / Math.PI);
  }
}
