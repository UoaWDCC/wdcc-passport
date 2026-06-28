import type { ReactNode } from "react";

import { requireUser } from "@/lib/access";

export default async function UserLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-950">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:pt-24">{children}</main>
    </div>
  );
}
