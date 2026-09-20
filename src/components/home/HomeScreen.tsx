import Image from "next/image";

import { SCENE_H, SCENE_W } from "@/components/home/scene";

const WEBSTER = { src: "/assets/pixel/webster.png", w: 382, h: 520 };
/** Where Webster stands, in scene units: on the grass in front of the fence, centred. */
const STAND = { w: 196, h: 267, top: 239 };

export function HomeScreen() {
  return (
    <div
      className="absolute inset-0"
      // The scale the shell draws the backdrop at (cover), so Webster scales with the scene.
      style={{ "--s": `max(100cqw / ${SCENE_W}, 100cqh / ${SCENE_H})` } as React.CSSProperties}
    >
      <Image
        src={WEBSTER.src}
        alt="Webster"
        width={WEBSTER.w}
        height={WEBSTER.h}
        unoptimized
        priority
        className="absolute"
        style={{
          left: `calc(50cqw - ${STAND.w / 2} * var(--s))`,
          top: `calc(${STAND.top} * var(--s))`,
          width: `calc(${STAND.w} * var(--s))`,
          height: `calc(${STAND.h} * var(--s))`,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
