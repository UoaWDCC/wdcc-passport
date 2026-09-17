"use client";

import dynamic from "next/dynamic";

// three.js touches window/document at import time, so the scene is client-only.
const CardViewerScene = dynamic(() => import("./CardViewerScene"), {
  ssr: false,
  loading: () => (
    <div role="status" className="flex h-full items-center justify-center text-sm text-white/60">
      Loading viewer…
    </div>
  ),
});

export function CardViewer() {
  return <CardViewerScene />;
}
