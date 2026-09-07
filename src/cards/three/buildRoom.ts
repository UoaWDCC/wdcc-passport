import {
  AmbientLight,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
} from "three";
import type { SceneDims } from "../types";

export const ROOM_BACKGROUND = 0x9fb0cc;

/** Box room behind the screen plane: floor, ceiling, back and side walls plus lights (pokebox solid mode). */
export function buildRoom(dims: SceneDims): Group {
  const { screenW, screenH, boxD } = dims;
  const hw = screenW / 2;
  const hh = screenH / 2;
  const group = new Group();

  const wall = (color: number, roughness = 0.9) => new MeshStandardMaterial({ color, roughness });

  const surfaces: Array<{
    w: number;
    h: number;
    mat: MeshStandardMaterial;
    rot: [number, number, number];
    pos: [number, number, number];
  }> = [
    { w: screenW, h: screenH, mat: wall(0xdde4f0), rot: [0, 0, 0], pos: [0, 0, -boxD] },
    {
      w: screenW,
      h: boxD,
      mat: wall(0x4a6a8a, 0.7),
      rot: [-Math.PI / 2, 0, 0],
      pos: [0, -hh, -boxD / 2],
    },
    { w: screenW, h: boxD, mat: wall(0xd0d8e8), rot: [Math.PI / 2, 0, 0], pos: [0, hh, -boxD / 2] },
    {
      w: boxD,
      h: screenH,
      mat: wall(0x5b7faa),
      rot: [0, Math.PI / 2, 0],
      pos: [-hw, 0, -boxD / 2],
    },
    {
      w: boxD,
      h: screenH,
      mat: wall(0x5b7faa),
      rot: [0, -Math.PI / 2, 0],
      pos: [hw, 0, -boxD / 2],
    },
  ];
  for (const s of surfaces) {
    const mesh = new Mesh(new PlaneGeometry(s.w, s.h), s.mat);
    mesh.rotation.set(...s.rot);
    mesh.position.set(...s.pos);
    group.add(mesh);
  }

  group.add(new AmbientLight(0xffffff, 0.6));
  const dir = new DirectionalLight(0xffffff, 1.2);
  dir.position.set(hw * 0.4, hh, boxD * 0.5);
  group.add(dir);
  const back = new PointLight(0xdde8ff, 6, boxD * 3, 1);
  back.position.set(0, hh * 0.6, -boxD * 0.6);
  group.add(back);

  return group;
}

export function disposeRoom(group: Group): void {
  group.removeFromParent();
  group.traverse((obj) => {
    const m = obj as Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as MeshStandardMaterial | undefined;
    if (mat) mat.dispose();
  });
}
