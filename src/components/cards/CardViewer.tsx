"use client";

import dynamic from "next/dynamic";

// three.js touches window/document at import time, so the scene is client-only.
const CardViewerScene = dynamic(() => import("./CardViewerScene"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#9fb0cc] text-sm text-white/60">
      Loading viewer…
    </div>
  ),
});

export function CardViewer() {
  return <CardViewerScene />;
}
