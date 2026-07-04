import type { ReactNode } from "react";

interface HoverCardProps {
  content: ReactNode;
  children: ReactNode;
}

export function HoverCard({ content, children }: HoverCardProps) {
  return (
    <span className="group relative inline-block" tabIndex={0}>
      {children}
      <span
        role="tooltip"
        className={`bg-foreground text-background pointer-events-none invisible absolute top-full left-1/2 z-10 mt-2 w-max max-w-64 -translate-x-1/2 rounded-md px-3 py-2 text-sm opacity-0 shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100`}
      >
        {content}
      </span>
    </span>
  );
}
