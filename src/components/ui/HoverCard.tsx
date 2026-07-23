"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface HoverCardProps {
  content: ReactNode;
  children: ReactNode;
}

export function HoverCard({ content, children }: HoverCardProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <span
      ref={ref}
      className="group relative inline-block"
      tabIndex={0}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full left-1/2 z-10 mt-2 w-max max-w-64 -translate-x-1/2 rounded-md bg-white px-3 py-2 text-sm text-black shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        {content}
      </span>
    </span>
  );
}
