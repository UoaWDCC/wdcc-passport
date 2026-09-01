"use client";

import { useState } from "react";

import { BadgesSection } from "@/components/home/BadgesSection";
import { ScannerComponent } from "@/components/scan/Scanner";

const tabs = [
  {
    id: "profile",
    label: "Profile",
  },
  {
    id: "badges",
    label: "Badges",
  },
  {
    id: "qr",
    label: "QR Code",
  },
  {
    id: "packs",
    label: "Packs",
  },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function MobileHome() {
  const [activeTab, setActiveTab] = useState<TabId>("badges");

  return (
    <div className="md:hidden">
      <header className="fixed inset-x-0 top-0 z-10 h-14 bg-blue-950" />

      <div className="pt-14 pb-24">
        {activeTab === "profile" && (
          <p className="py-10 text-center text-sm text-white/60">Profile coming soon.</p>
        )}
        {activeTab === "badges" && <BadgesSection />}
        {activeTab === "qr" && <ScannerComponent />}
        {activeTab === "packs" && (
          <p className="py-10 text-center text-sm text-white/60">Packs & cards coming soon.</p>
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-white/10 bg-gray-950 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold transition ${
              activeTab === tab.id ? "text-white" : "text-white/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
