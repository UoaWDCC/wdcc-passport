import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/access";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:pt-24">{children}</main>
    </div>
  );
}
