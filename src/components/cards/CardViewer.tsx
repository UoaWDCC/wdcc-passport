"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { CardDex } from "@/components/cards/CardDex";

// three.js touches window/document at import time, so the scene is client-only.
const CardViewerScene = dynamic(() => import("./CardViewerScene"), {
  ssr: false,
  loading: () => (
    <div role="status" className="flex h-full items-center justify-center text-sm text-white/60">
      Loading viewer…
    </div>
  ),
});

type Tab = "dex" | "fan" | "stack";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "dex", label: "Webdex" },
  { id: "fan", label: "Fan" },
  { id: "stack", label: "Stack" },
];

const PILL =
  "rounded-full bg-black/50 px-3 py-2 text-[10px] text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none";

export function CardViewer() {
  const [tab, setTab] = useState<Tab>("dex");
  const [openId, setOpenId] = useState<string | null>(null);

  const tabs = (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setOpenId(null);
            }}
            className={`${PILL} ${tab === t.id ? "bg-white/30 text-white ring-2 ring-white/80" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {openId !== null && (
        <button
          type="button"
          onClick={() => setOpenId(null)}
          aria-label="Back to the Webdex"
          className={PILL}
        >
          ‹
        </button>
      )}
    </div>
  );

  if (tab === "dex" && openId === null) return <CardDex tabs={tabs} onOpen={setOpenId} />;
  return (
    <CardViewerScene
      mode={tab === "dex" ? "single" : tab}
      initialId={openId ?? undefined}
      tabs={tabs}
    />
  );
}
