"use client";

import Image from "next/image";
import { useState, type CSSProperties, type PointerEvent } from "react";

/** Where the top strip tears off, as a fraction of the pack height. */
const TEAR_LINE = 18;
/** How far across the pack (0-1) the slit must reach before the top comes off. */
const TEAR_PROGRESS = 0.6;
/** The top strip is drawn as thin vertical slices so it can bend smoothly behind the slit. */
const SLICES = 24;
/** Distance behind the slit front (fraction of the pack width) at which the curl reaches
    BEND_LIFT / BEND_LEAN; it keeps rising past that, so the loose end never flattens out. */
const BEND_SPAN = 0.5;
/** Lift in % of the pack height, lean in degrees, at BEND_SPAN behind the front. */
const BEND_LIFT = 3;
const BEND_LEAN = 6;

/** Crimped foil seam along the top and bottom edges of the pouch. */
const CRIMP =
  "repeating-linear-gradient(90deg, rgba(255,255,255,0.22) 0 3px, rgba(0,0,0,0.3) 3px 6px)";
/** Puffed-pouch shading: lighter middle, darker edges. */
const PUFF =
  "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.12), rgba(0,0,0,0) 45%, rgba(0,0,0,0.5) 100%)";
/** Foil sheen that slides across with the pointer. */
const SHEEN =
  "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.3) 50%, transparent 65%)";

type Drag = {
  startX: number;
  /** Pack width in px, so the swipe maps to a fraction of the tear. */
  width: number;
  /** 1 = tearing left to right, -1 = right to left. */
  dir: 1 | -1;
  /** How far across the pack the slit has reached, 0-1. */
  progress: number;
};

/** Pointer position over the pack, -1..1 on each axis. */
type Tilt = { x: number; y: number };

/**
 * A single pack the user tears open by swiping across its top strip
 * (Pokémon TCG Pocket style). `onTear` fires the moment the tear is committed;
 * `onDone` fires once the opening animation has finished (immediately under
 * reduced motion).
 */
export function PackTear({
  image,
  onTear,
  onDone,
}: {
  image: string;
  onTear: () => void;
  onDone: () => void;
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const [torn, setTorn] = useState(false);
  const [tilt, setTilt] = useState<Tilt | null>(null);

  function tear() {
    onTear();
    // No animation fires under reduced motion, so onAnimationEnd never would either.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDone();
      return;
    }
    setTorn(true);
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (torn) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      startX: e.clientX,
      width: e.currentTarget.getBoundingClientRect().width,
      dir: 1,
      progress: 0,
    });
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!drag || torn) return;
    const dx = e.clientX - drag.startX;
    // The first movement picks the tear direction; after that only progress along it counts.
    const dir = drag.progress === 0 && dx !== 0 ? (dx > 0 ? 1 : -1) : drag.dir;
    const progress = Math.min(1, Math.max(0, (dx * dir) / drag.width));
    setDrag({ ...drag, dir, progress });
  }

  function onPointerUp() {
    if (!drag || torn) return;
    if (drag.progress >= TEAR_PROGRESS) tear();
    else setDrag(null);
  }

  function onTiltMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: ((e.clientY - r.top) / r.height) * 2 - 1,
    });
  }

  const progress = torn ? 1 : (drag?.progress ?? 0);
  const dir = drag?.dir ?? 1;
  const settling = !drag && !torn;
  const sheenStyle = {
    backgroundImage: SHEEN,
    backgroundSize: "250% 100%",
    backgroundPosition: `${50 - (tilt?.x ?? 0) * 50}% 0`,
    transition: tilt ? undefined : "background-position 400ms",
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <div style={{ perspective: "900px" }}>
        {/* The pouch: tilts toward the pointer so it reads as an object, not a picture. */}
        <div
          onPointerMove={onTiltMove}
          onPointerLeave={() => setTilt(null)}
          style={{
            transformStyle: "preserve-3d",
            transform:
              tilt && !torn ? `rotateX(${-tilt.y * 6}deg) rotateY(${tilt.x * 8}deg)` : undefined,
            transition: tilt ? undefined : "transform 400ms",
          }}
          className="relative w-72 drop-shadow-[0_24px_40px_rgba(0,0,0,0.6)] select-none sm:w-80 md:w-96"
        >
          {!torn && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 animate-pulse rounded-xl shadow-[0_0_24px_8px_rgba(168,85,247,0.5),0_0_64px_16px_rgba(126,34,206,0.3)] ring-2 ring-purple-400/60 motion-reduce:animate-none"
            />
          )}
          {/* Body: everything below the tear line; sizes the box and ends the sequence. */}
          <div
            onAnimationEnd={onDone}
            style={{ clipPath: `inset(${TEAR_LINE}% 0 0 0)` }}
            className={`relative ${torn ? "animate-pack-body" : ""}`}
          >
            <Image
              src={image}
              alt=""
              width={500}
              height={700}
              draggable={false}
              className="h-auto w-full rounded-xl"
            />
            <div aria-hidden style={{ background: PUFF }} className="absolute inset-0 rounded-xl" />
            <div aria-hidden style={sheenStyle} className="absolute inset-0 rounded-xl" />
            <div
              aria-hidden
              style={{ background: CRIMP }}
              className="absolute inset-x-0 bottom-0 h-[3.5%] rounded-b-xl"
            />
          </div>

          {/* Top strip: swipe across it to tear (Enter tears it straight off). Behind the
              slit the strip is loose and curls up smoothly; ahead of it it lies flat. */}
          <button
            type="button"
            aria-label="Tear open the pack"
            disabled={torn}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrag(null)}
            onClick={(e) => {
              if (e.detail === 0) tear(); // keyboard activation only
            }}
            style={{
              ...({ "--tear-dir": dir } as CSSProperties),
              height: `${TEAR_LINE}%`,
            }}
            className={`absolute inset-x-0 top-0 cursor-grab touch-none rounded-t-xl focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none active:cursor-grabbing ${
              torn ? "animate-pack-lid" : ""
            }`}
          >
            {Array.from({ length: SLICES }, (_, i) => {
              const left = i / SLICES;
              const right = (i + 1) / SLICES;
              const centre = (left + right) / 2;
              // How far this slice sits behind the slit front, 0-1 along the tear direction.
              const behind = dir === 1 ? progress - centre : centre - (1 - progress);
              const t = Math.max(0, behind / BEND_SPAN);
              // Quadratic and uncapped: flat at the front, ever steeper toward the loose end.
              const lift = BEND_LIFT * t * t;
              const lean = dir * BEND_LEAN * t;
              return (
                <div
                  key={i}
                  aria-hidden
                  style={{
                    height: `${10000 / TEAR_LINE}%`,
                    // Slices overlap a touch so the bend shows no hairline seams.
                    clipPath: `inset(0 ${Math.max(0, (1 - right) * 100 - 0.3)}% ${100 - TEAR_LINE}% ${left * 100}%)`,
                    transformOrigin: `${centre * 100}% ${TEAR_LINE}%`,
                    transform: t > 0 ? `translateY(${-lift}%) rotate(${lean}deg)` : undefined,
                    filter: t > 0 ? `brightness(${1 - 0.2 * Math.min(1, t)})` : undefined,
                    transition: settling || torn ? "transform 150ms, filter 150ms" : undefined,
                  }}
                  className="absolute inset-x-0 top-0"
                >
                  <Image
                    src={image}
                    alt=""
                    width={500}
                    height={700}
                    draggable={false}
                    className="absolute inset-x-0 top-0 h-auto w-full rounded-xl"
                  />
                  <div
                    aria-hidden
                    style={{ background: PUFF }}
                    className="absolute inset-0 rounded-xl"
                  />
                  <div aria-hidden style={sheenStyle} className="absolute inset-0 rounded-xl" />
                  <div
                    aria-hidden
                    style={{ background: CRIMP, height: `${TEAR_LINE * 0.2}%` }}
                    className="absolute inset-x-0 top-0 rounded-t-xl"
                  />
                </div>
              );
            })}
          </button>

          {!torn && !drag && (
            <div
              aria-hidden
              style={{ top: `${TEAR_LINE}%` }}
              className="pointer-events-none absolute -right-3 -left-9 z-10 flex -translate-y-1/2 items-center gap-1"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                className="h-5 w-5 shrink-0 text-neutral-300/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
              >
                <circle cx="5" cy="7" r="2.5" />
                <circle cx="5" cy="17" r="2.5" />
                <path d="M7 8.6 21 16M7 15.4 21 8" />
              </svg>
              <div className="flex-1 border-t-2 border-dotted border-neutral-300/60 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
            </div>
          )}

          {/* The slit: grows from the side the swipe started on, showing the dark inside,
              and fades out as the strip slides away. */}
          <div
            aria-hidden
            style={{
              top: `${TEAR_LINE - 1}%`,
              width: `${progress * 100}%`,
              [dir === 1 ? "left" : "right"]: 0,
              opacity: torn ? 0 : 1,
              transition: torn
                ? "width 150ms, opacity 200ms 150ms"
                : settling
                  ? "width 150ms"
                  : undefined,
            }}
            className="absolute h-[2%] bg-[#0b0b10] shadow-[0_1px_0_rgba(255,255,255,0.45)]"
          />
        </div>
      </div>
      {!torn && (
        <p className="text-sm text-white/60">Swipe across the top of the pack to open it</p>
      )}
    </div>
  );
}
