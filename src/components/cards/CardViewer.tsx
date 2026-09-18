"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { CardDex } from "@/components/cards/CardDex";
import { pixelButton } from "@/components/ui/pixel";

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

export function CardViewer() {
  const [tab, setTab] = useState<Tab>("dex");
  const [openId, setOpenId] = useState<string | null>(null);
  const [count, setCount] = useState("");

  useEffect(() => {
    void import("./CardViewerScene");
  }, []);

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
            className={pixelButton({ variant: tab === t.id ? "gold" : "parchment", size: "sm" })}
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
          className={pixelButton({ size: "icon" })}
        >
          ‹
        </button>
      )}
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col gap-3 py-3 text-white [text-shadow:2px_2px_0_#000]">
      <header className="flex items-start justify-between gap-2">
        {tabs}
        <span className="text-xs tabular-nums" aria-live="polite">
          {count}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "dex" && openId === null ? (
          <CardDex onOpen={setOpenId} onCount={setCount} />
        ) : (
          <CardViewerScene
            mode={tab === "dex" ? "single" : tab}
            initialId={openId ?? undefined}
            onCount={setCount}
          />
        )}
      </div>
    </div>
  );
}
