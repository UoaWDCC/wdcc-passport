import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, type Texture } from "three";

/** Trading-card aspect ratio (63 mm × 88 mm). */
export const CARD_ASPECT = 63 / 88;

export interface CardTextures {
  front: Texture;
  back: Texture;
}

/**
 * A card is a group of two single-sided planes (front, and back rotated 180°) so
 * each face shows its own image the right way round. The group's scale is the card height.
 */
export interface CardObject {
  //group will be removed later when we add shaders bc we can add a double-sided plane
  group: Group;
  front: Mesh;
  back: Mesh;
}

export function buildCardObject(textures: CardTextures, height: number): CardObject {
  const geometry = new PlaneGeometry(CARD_ASPECT, 1);
  const front = new Mesh(geometry, new MeshBasicMaterial({ map: textures.front }));
  const back = new Mesh(geometry, new MeshBasicMaterial({ map: textures.back }));
  back.rotation.y = Math.PI;

  const group = new Group();
  group.add(front, back);
  group.scale.setScalar(height);
  return { group, front, back };
}

/** Draw order (used to keep a moving card on top of its neighbours). */
export function setCardRenderOrder(card: CardObject, order: number): void {
  card.front.renderOrder = order;
  card.back.renderOrder = order;
}

/** Disposes geometry and materials. Textures are owned by the caller. */
export function disposeCardObject(card: CardObject): void {
  card.group.removeFromParent();
  card.front.geometry.dispose();
  (card.front.material as MeshBasicMaterial).dispose();
  (card.back.material as MeshBasicMaterial).dispose();
}
