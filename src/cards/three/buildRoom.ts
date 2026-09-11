import {
  AmbientLight,
  BufferGeometry,
  DirectionalLight,
  Group,
  Line,
  LineDashedMaterial,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SpotLight,
  Vector3,
} from "three";
import type { SceneDims } from "../types";

/** pokebox scene.background. Only visible if something is drawn outside the box. */
export const ROOM_BACKGROUND = 0x0a1628;

/** pokebox's lighting panel values (its defaults.ts ships backlight 10 / spotlight 3). */
const LIGHTS = {
  ambientIntensity: 0.6,
  directionalIntensity: 0.9,
  backlightIntensity: 8.7,
  spotlightIntensity: 1.2,
  spotlightX: 0.4,
  spotlightY: 1.0,
  spotlightAngle: 48,
  spotlightPenumbra: 1.0,
};
/**
 * pokebox buildBoxShell in "solid" mode: the box behind the screen plane (dashed
 * edges, walls, floor, ceiling) and its lights. Not ported: the spotlight's shadow
 * (the cards cast none), candles and dim mode.
 */
export function buildRoom(dims: SceneDims): Group {
  const { screenW, screenH, boxD } = dims;
  const hw = screenW / 2;
  const hh = screenH / 2;
  const group = new Group();

  // ── Dashed edge lines ──
  const edgeMat = new LineDashedMaterial({ color: 0x2a3a5a, dashSize: 0.015, gapSize: 0.01 });
  const c = {
    fbl: new Vector3(-hw, -hh, 0),
    fbr: new Vector3(hw, -hh, 0),
    ftr: new Vector3(hw, hh, 0),
    ftl: new Vector3(-hw, hh, 0),
    bbl: new Vector3(-hw, -hh, -boxD),
    bbr: new Vector3(hw, -hh, -boxD),
    btr: new Vector3(hw, hh, -boxD),
    btl: new Vector3(-hw, hh, -boxD),
  };
  const edges: [Vector3, Vector3][] = [
    [c.bbl, c.bbr],
    [c.bbr, c.btr],
    [c.btr, c.btl],
    [c.btl, c.bbl],
    [c.fbl, c.bbl],
    [c.fbr, c.bbr],
    [c.ftr, c.btr],
    [c.ftl, c.btl],
    [c.fbl, c.fbr],
    [c.fbr, c.ftr],
    [c.ftr, c.ftl],
    [c.ftl, c.fbl],
  ];
  for (const [start, end] of edges) {
    const line = new Line(new BufferGeometry().setFromPoints([start, end]), edgeMat);
    line.computeLineDistances();
    group.add(line);
  }

  // ── Wall surfaces ──
  const backWallMat = new MeshStandardMaterial({
    color: 0xdde4f0,
    emissive: 0x334455,
    emissiveIntensity: 0.3,
    roughness: 0.9,
  });
  const sideWallMat = new MeshStandardMaterial({ color: 0x5b7faa, roughness: 1 });
  const floorMat = new MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.7 });
  const ceilingMat = new MeshStandardMaterial({
    color: 0xd0d8e8,
    roughness: 0.9,
    transparent: true,
    opacity: 0.85,
  });

  const surfaces: Array<{
    size: [number, number];
    material: MeshStandardMaterial;
    rotation: [number, number, number];
    position: [number, number, number];
  }> = [
    {
      size: [screenW, boxD],
      material: floorMat,
      rotation: [-Math.PI / 2, 0, 0],
      position: [0, -hh, -boxD / 2],
    },
    {
      size: [screenW, screenH],
      material: backWallMat,
      rotation: [0, 0, 0],
      position: [0, 0, -boxD],
    },
    {
      size: [screenW, boxD],
      material: ceilingMat,
      rotation: [Math.PI / 2, 0, 0],
      position: [0, hh, -boxD / 2],
    },
    {
      size: [boxD, screenH],
      material: sideWallMat,
      rotation: [0, Math.PI / 2, 0],
      position: [-hw, 0, -boxD / 2],
    },
    {
      size: [boxD, screenH],
      material: sideWallMat,
      rotation: [0, -Math.PI / 2, 0],
      position: [hw, 0, -boxD / 2],
    },
  ];
  for (const s of surfaces) {
    const mesh = new Mesh(new PlaneGeometry(...s.size), s.material);
    mesh.rotation.set(...s.rotation);
    mesh.position.set(...s.position);
    group.add(mesh);
  }

  // ── Lights ──
  group.add(new AmbientLight(0xffffff, LIGHTS.ambientIntensity));

  const dirLight = new DirectionalLight(0xffffff, LIGHTS.directionalIntensity);
  dirLight.position.set(0, hh * 0.8, boxD * 0.5);
  group.add(dirLight);

  const backLight = new PointLight(0xdde8ff, LIGHTS.backlightIntensity, boxD * 2);
  backLight.position.set(0, 0, -boxD * 0.7);
  group.add(backLight);

  // Fixed spotlight from the top right onto the back wall and floor.
  const spotlight = new SpotLight(
    0xffffff,
    LIGHTS.spotlightIntensity,
    0,
    (LIGHTS.spotlightAngle * Math.PI) / 180,
    LIGHTS.spotlightPenumbra,
    0,
  );
  spotlight.position.set(hw * LIGHTS.spotlightX, hh * LIGHTS.spotlightY, boxD * 0.1);
  spotlight.target.position.set(
    -hw * LIGHTS.spotlightX * 0.4,
    -hh * LIGHTS.spotlightY * 0.2,
    -boxD * 0.6,
  );
  group.add(spotlight, spotlight.target);

  return group;
}

export function disposeRoom(group: Group): void {
  group.removeFromParent();
  group.traverse((obj) => {
    if (obj instanceof Mesh || obj instanceof Line) {
      obj.geometry.dispose();
      (obj.material as MeshStandardMaterial | LineDashedMaterial).dispose();
    }
  });
}
