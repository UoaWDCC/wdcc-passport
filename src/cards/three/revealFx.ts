import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  type Scene,
} from "three";
import type { CardRarity } from "../types";
import { CARD_ASPECT, type CardObject } from "./buildCard";

/** Aura colour per rarity; commons get none, so the others feel earned. */
export const RARITY_AURA: Record<CardRarity, number | null> = {
  common: null,
  rare: 0x3b9dff,
  epic: 0xa855f7,
  legendary: 0xff9a2e,
};

/** Pulse speed (rad/s) of a revealed card's aura. */
const AURA_PULSE: Record<CardRarity, number> = { common: 0, rare: 2.2, epic: 3.2, legendary: 2.6 };
/** Peak aura opacity of a revealed card: a rare is a quiet glow, the rest are loud. */
const AURA_STRENGTH: Record<CardRarity, number> = { common: 0, rare: 0.4, epic: 0.5, legendary: 1 };
/** Sparkles per second drifting off a revealed card. */
const EMBER_RATE: Record<CardRarity, number> = { common: 0, rare: 0, epic: 5, legendary: 14 };
const BURST_COUNT: Record<CardRarity, number> = { common: 0, rare: 0, epic: 18, legendary: 64 };

/** Aura plane size, in card heights: the card plus a halo margin all round. */
const AURA_W = CARD_ASPECT + 0.42;
const AURA_H = 1 + 0.42;
/** Legendary ray burst diameter, in card heights. */
const RAYS_SIZE = 2.9;
const MAX_SPARKLES = 128;

function canvas2d(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is not available");
  return [canvas, ctx];
}

/** A soft white halo around the card's silhouette, hollow in the middle so it never tints the card. */
function glowTexture(): CanvasTexture {
  const px = 256;
  const [canvas, ctx] = canvas2d(Math.round(px * (AURA_W / AURA_H)), px);
  const margin = (0.21 / AURA_H) * px;
  const w = canvas.width - margin * 2;
  const h = canvas.height - margin * 2;
  // shadowBlur rather than ctx.filter, which Safari does not support.
  ctx.shadowColor = "#ffffff";
  ctx.fillStyle = "#ffffff";
  for (const blur of [margin * 0.95, margin * 0.55, margin * 0.25]) {
    ctx.shadowBlur = blur;
    ctx.beginPath();
    ctx.roundRect(margin, margin, w, h, w * 0.06);
    ctx.fill();
  }
  // Cut the card's own shape back out (a touch inset, so the halo tucks under the card's edge).
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.roundRect(margin + 2, margin + 2, w - 4, h - 4, w * 0.06);
  ctx.fill();
  return new CanvasTexture(canvas);
}

/** Wedges of light fanning out from the centre, fading to nothing at the rim. */
function raysTexture(): CanvasTexture {
  const px = 512;
  const [canvas, ctx] = canvas2d(px, px);
  const c = px / 2;
  const fade = ctx.createRadialGradient(c, c, 0, c, c, c);
  fade.addColorStop(0, "rgba(255,255,255,0.95)");
  fade.addColorStop(0.35, "rgba(255,255,255,0.5)");
  fade.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = fade;
  const wedges = 18;
  for (let i = 0; i < wedges; i++) {
    const a = (i / wedges) * Math.PI * 2;
    const half = (Math.PI / wedges) * (i % 2 ? 0.55 : 0.3);
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, c, a - half, a + half);
    ctx.closePath();
    ctx.fill();
  }
  return new CanvasTexture(canvas);
}

/** A glowing gold plate the shape of a card: hides a legendary's art until its reveal. */
function coverTexture(): CanvasTexture {
  const h = 352;
  const w = Math.round(h * CARD_ASPECT);
  const [canvas, ctx] = canvas2d(w, h);
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, w * 0.06);
  ctx.clip();
  const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, h * 0.7);
  g.addColorStop(0, "#fff8dc");
  g.addColorStop(0.35, "#ffd166");
  g.addColorStop(1, "#ff8a1e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Diagonal shine streaks.
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#ffffff";
  for (const x of [-0.1, 0.35, 0.62]) {
    ctx.beginPath();
    ctx.moveTo(w * x, h);
    ctx.lineTo(w * (x + 0.12), h);
    ctx.lineTo(w * (x + 0.62), 0);
    ctx.lineTo(w * (x + 0.5), 0);
    ctx.closePath();
    ctx.fill();
  }
  return new CanvasTexture(canvas);
}

function sparkleTexture(): CanvasTexture {
  const px = 64;
  const [canvas, ctx] = canvas2d(px, px);
  const c = px / 2;
  const g = ctx.createRadialGradient(c, c, 0, c, c, c);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, px, px);
  return new CanvasTexture(canvas);
}

/** What the effects need to know about a pile card each frame. */
export interface RevealFxTarget {
  card: CardObject;
  slot: number;
  rarity: CardRarity;
  revealed: boolean;
  /** 0..1 through the legendary charge-up, or null when it is not playing. */
  charge: number | null;
  /** 0..1 through the legendary showcase, or null when it is not playing. */
  showcase: number | null;
}

interface Aura {
  mesh: Mesh;
  material: MeshBasicMaterial;
  opacity: number;
}

interface Sparkle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: Color;
}

/**
 * Pack-reveal dressing for the stack: a rarity-coloured aura behind each card, a
 * ray burst behind a legendary, and sparkles. Everything is an additive plane or
 * point sprite (no post-processing), so it stays cheap on phones.
 */
export class RevealEffects {
  private readonly glow = glowTexture();
  private readonly auraGeometry = new PlaneGeometry(AURA_W, AURA_H);
  private readonly auras = new Map<CardObject, Aura>();
  /** Legendaries only: the plate hiding the art until the reveal. */
  private readonly coverTex = coverTexture();
  private readonly coverGeometry = new PlaneGeometry(CARD_ASPECT, 1);
  private readonly covers = new Map<CardObject, Aura>();

  private readonly raysTex = raysTexture();
  private readonly rays: Mesh;
  private readonly raysMaterial: MeshBasicMaterial;
  private raysOpacity = 0;

  private readonly sparkleTex = sparkleTexture();
  private readonly sparkles: Sparkle[] = [];
  private readonly points: Points;
  private readonly positions = new Float32Array(MAX_SPARKLES * 3);
  private readonly colors = new Float32Array(MAX_SPARKLES * 3);
  private emberDebt = 0;

  constructor(
    scene: Scene,
    private readonly reducedMotion: boolean,
  ) {
    this.raysMaterial = new MeshBasicMaterial({
      map: this.raysTex,
      color: RARITY_AURA.legendary ?? 0xffffff,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      // Pure background: drawn first and never depth-tested, so a tilting or spinning card
      // paints over it instead of cutting through it.
      depthWrite: false,
      depthTest: false,
    });
    this.rays = new Mesh(new PlaneGeometry(1, 1), this.raysMaterial);
    this.rays.visible = false;
    this.rays.renderOrder = -2;
    scene.add(this.rays);

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(this.positions, 3));
    geometry.setAttribute("color", new BufferAttribute(this.colors, 3));
    this.points = new Points(
      geometry,
      new PointsMaterial({
        map: this.sparkleTex,
        size: 1,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.points.frustumCulled = false;
    this.points.renderOrder = 300;
    scene.add(this.points);
  }

  /** Give a card its aura (commons get none). The aura rides on the card's group. */
  attach(card: CardObject, rarity: CardRarity): void {
    const color = RARITY_AURA[rarity];
    if (color === null || this.auras.has(card)) return;
    const material = new MeshBasicMaterial({
      map: this.glow,
      color,
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      side: DoubleSide,
    });
    const mesh = new Mesh(this.auraGeometry, material);
    // Drawn before the cards, so it is always background: the card (and the pile) paint over it.
    mesh.renderOrder = -1;
    card.group.add(mesh);
    this.auras.set(card, { mesh, material, opacity: 0 });

    if (rarity !== "legendary" || this.reducedMotion) return;
    const coverMaterial = new MeshBasicMaterial({
      map: this.coverTex,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      // The mirror of the aura: in the card's plane but winning the depth test, so it
      // sits on top of the art whichever way the card is facing.
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -4,
    });
    const cover = new Mesh(this.coverGeometry, coverMaterial);
    // Just proud of the face as well: the cover is only ever shown while the card faces forward.
    cover.position.z = 0.004;
    cover.renderOrder = 2;
    card.group.add(cover);
    this.covers.set(card, { mesh: cover, material: coverMaterial, opacity: 1 });
  }

  detach(card: CardObject): void {
    const aura = this.auras.get(card);
    if (!aura) return;
    aura.mesh.removeFromParent();
    aura.material.dispose();
    this.auras.delete(card);
    const cover = this.covers.get(card);
    if (!cover) return;
    cover.mesh.removeFromParent();
    cover.material.dispose();
    this.covers.delete(card);
  }

  /** The card just had its reveal moment: throw sparkles outward from it. */
  burst(card: CardObject, rarity: CardRarity): void {
    const color = RARITY_AURA[rarity];
    if (color === null || this.reducedMotion) return;
    const cardH = card.group.scale.x;
    const { x, y, z } = card.group.position;
    for (let i = 0; i < BURST_COUNT[rarity]; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = cardH * (0.5 + Math.random() * 1.3);
      this.spawn({
        x: x + Math.cos(a) * cardH * 0.2,
        y: y + Math.sin(a) * cardH * 0.3,
        // Just behind the card, which hides any that cross it: sparkles are background too.
        z: z - cardH * 0.04,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        vz: 0,
        maxLife: 0.7 + Math.random() * 0.7,
        color,
      });
    }
  }

  tick(now: number, dt: number, targets: readonly RevealFxTarget[]): void {
    const top = targets.find((t) => t.slot === 0);

    // ── Auras: only the revealed top card glows; a legendary flickers as its showcase builds. ──
    for (const t of targets) {
      const aura = this.auras.get(t.card);
      if (!aura) continue;
      let target = 0;
      if (t.slot === 0 && t.revealed) {
        target = (0.78 + 0.2 * Math.sin(now * AURA_PULSE[t.rarity])) * AURA_STRENGTH[t.rarity];
      } else if (t.rarity === "legendary" && !this.reducedMotion) {
        // Hidden under its cover: a faint glow in the pile, flaring and flickering as it charges.
        const c = t.charge ?? 0;
        target = t.slot === 0 ? 0.25 + 0.6 * c + 0.12 * Math.sin(now * (9 + 20 * c)) : 0.12;
      }
      aura.opacity += (target - aura.opacity) * (1 - Math.pow(0.002, dt));
      aura.material.opacity = aura.opacity;
      aura.mesh.visible = aura.opacity > 0.01;
      aura.mesh.scale.setScalar(this.reducedMotion ? 1 : 1 + 0.03 * Math.sin(now * 1.7));
    }

    // ── Legendary covers: solid until the reveal, then burnt away fast ──
    for (const t of targets) {
      const cover = this.covers.get(t.card);
      if (!cover) continue;
      cover.opacity += ((t.revealed ? 0 : 1) - cover.opacity) * (1 - Math.pow(0.00001, dt));
      cover.material.opacity = cover.opacity;
      cover.mesh.visible = cover.opacity > 0.01;
    }

    // ── Legendary rays: burst open with the showcase, then idle behind the card. ──
    const legendary =
      top &&
      top.rarity === "legendary" &&
      (top.revealed || top.showcase !== null || top.charge !== null);
    let raysTarget = 0;
    if (legendary && top) {
      const g = top.card.group;
      const cardH = g.scale.x;
      // Creep open through the charge, then burst the rest of the way with the showcase.
      let grow = 1;
      if (top.charge !== null) grow = 0.5 * top.charge;
      else if (top.showcase !== null) {
        const open = Math.min(1, top.showcase / 0.3);
        grow = 0.5 + 0.5 * (1 - Math.pow(1 - open, 3));
      }
      this.rays.position.set(g.position.x, g.position.y, g.position.z - cardH * 0.03);
      this.rays.scale.setScalar(cardH * RAYS_SIZE * (0.2 + 0.8 * grow));
      if (!this.reducedMotion) this.rays.rotation.z += dt * (0.35 + (top.charge ?? 0) * 1.2);
      if (top.charge !== null) raysTarget = 0.6 * top.charge;
      else raysTarget = top.showcase !== null ? 0.9 : 0.38 + 0.08 * Math.sin(now * 2.1);
    }
    this.raysOpacity += (raysTarget - this.raysOpacity) * (1 - Math.pow(0.004, dt));
    this.raysMaterial.opacity = this.raysOpacity;
    this.rays.visible = this.raysOpacity > 0.01;

    // ── Embers drifting up off a revealed epic or legendary ──
    const emberRate = !top
      ? 0
      : top.revealed
        ? EMBER_RATE[top.rarity]
        : top.rarity === "legendary" && top.charge !== null
          ? 26 * top.charge
          : 0;
    if (top && emberRate > 0 && !this.reducedMotion) {
      const color = RARITY_AURA[top.rarity];
      this.emberDebt += emberRate * dt;
      const g = top.card.group;
      const cardH = g.scale.x;
      while (this.emberDebt >= 1 && color !== null) {
        this.emberDebt -= 1;
        // A random point on the card's outline.
        const onSide = Math.random() < 0.5;
        const u = Math.random() - 0.5;
        const edge = Math.random() < 0.5 ? -0.5 : 0.5;
        this.spawn({
          x: g.position.x + (onSide ? edge : u) * cardH * CARD_ASPECT,
          y: g.position.y + (onSide ? u : edge) * cardH,
          z: g.position.z - cardH * 0.04,
          vx: (Math.random() - 0.5) * cardH * 0.08,
          vy: cardH * (0.1 + Math.random() * 0.12),
          vz: 0,
          maxLife: 1.4 + Math.random() * 0.9,
          color,
        });
      }
    } else {
      this.emberDebt = 0;
    }

    this.updateSparkles(dt, top ? top.card.group.scale.x : 1);
  }

  dispose(): void {
    for (const card of [...this.auras.keys()]) this.detach(card);
    this.rays.removeFromParent();
    this.rays.geometry.dispose();
    this.raysMaterial.dispose();
    this.points.removeFromParent();
    this.points.geometry.dispose();
    (this.points.material as PointsMaterial).dispose();
    this.auraGeometry.dispose();
    this.coverGeometry.dispose();
    this.coverTex.dispose();
    this.glow.dispose();
    this.raysTex.dispose();
    this.sparkleTex.dispose();
  }

  private spawn(s: Omit<Sparkle, "life" | "color"> & { color: number }): void {
    if (this.sparkles.length >= MAX_SPARKLES) this.sparkles.shift();
    this.sparkles.push({ ...s, life: 0, color: new Color(s.color) });
  }

  private updateSparkles(dt: number, cardH: number): void {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        this.sparkles.splice(i, 1);
        continue;
      }
      // Burst particles shed their speed quickly, then hang and fade.
      const drag = Math.pow(0.12, dt);
      s.vx *= drag;
      s.vz *= drag;
      s.vy = s.vy * drag + cardH * 0.05 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
    }
    this.colors.fill(0);
    this.sparkles.forEach((s, i) => {
      const k = i * 3;
      this.positions[k] = s.x;
      this.positions[k + 1] = s.y;
      this.positions[k + 2] = s.z;
      // Additive blending: fading to black is fading out.
      const f = Math.sin((s.life / s.maxLife) * Math.PI);
      this.colors[k] = s.color.r * f;
      this.colors[k + 1] = s.color.g * f;
      this.colors[k + 2] = s.color.b * f;
    });
    const geometry = this.points.geometry;
    geometry.setDrawRange(0, this.sparkles.length);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    (this.points.material as PointsMaterial).size = cardH * 0.07;
  }
}
