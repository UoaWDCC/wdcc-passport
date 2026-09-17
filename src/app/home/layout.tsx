import type { ReactNode } from "react";
import type { Viewport } from "next";
import { redirect } from "next/navigation";

import { HomeShell } from "@/components/home/HomeShell";
import { pixelFont } from "@/components/home/font";
import { requireUser } from "@/lib/access";

// Needed for env(safe-area-inset-*) to be non-zero on notched phones.
export const viewport: Viewport = { viewportFit: "cover" };

export default async function UserLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className={`fixed inset-0 text-white ${pixelFont.className}`}>
      <HomeShell>{children}</HomeShell>
    </div>
  );
}
