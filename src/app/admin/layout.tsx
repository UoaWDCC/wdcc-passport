import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import NavBar from "@/components/NavBar";
import { getCurrentUserAccess } from "@/lib/access";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const access = await getCurrentUserAccess();

  if (access.status === "no_role") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-950">
      <NavBar access={access} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:pt-24">
        {children}
      </main>
    </div>
  );
}
