import Image from "next/image";

const WEBSTER = { src: "/assets/pixel/webster.png", w: 382, h: 520 };

export function HomeScreen() {
  return (
    <div
      className="absolute inset-0"
      style={{ "--s": "max(100cqw / 350, 100cqh / 621)" } as React.CSSProperties}
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
          left: "calc(50cqw - 96 * var(--s))",
          top: "calc(232 * var(--s))",
          width: "calc(191 * var(--s))",
          height: "calc(260 * var(--s))",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
