"use client";

import { type ReactNode } from "react";

interface HoverCardProps {
  content: ReactNode;
  children: ReactNode;
}

export function HoverCard({ content, children }: HoverCardProps) {
  return (
    <span className="group relative block leading-none transition duration-150 hover:-translate-y-1">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 px-3 py-2 text-center text-sm text-white opacity-0 backdrop-blur-sm transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}
