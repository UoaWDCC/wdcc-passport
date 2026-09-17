import type { Viewport } from "next";

import { HomeScreen } from "@/components/home/HomeScreen";
import { pixelFont } from "@/components/home/font";
import { requireUser } from "@/lib/access";

// Needed for env(safe-area-inset-*) to be non-zero on notched phones.
export const viewport: Viewport = { viewportFit: "cover" };

export default async function Home() {
  await requireUser();

  return (
    <div className={`fixed inset-0 ${pixelFont.className}`}>
      <HomeScreen />
    </div>
  );
}
