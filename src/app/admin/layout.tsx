import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/access";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-950">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:pt-24">{children}</main>
    </div>
  );
}
