import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";

import Navbar from "@/components/Navbar";
import { auth } from "@/lib/auth";

const ROLE_COOKIE_NAME = "role";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const role = (await cookies()).get(ROLE_COOKIE_NAME)?.value;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || (role !== "admin" && role !== "user")) {
    redirect("/");
  }

  if (role === "user") {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-950">
      <Navbar access={{ status: role, email: session.user.email }} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 md:pt-24">
        {children}
      </main>
    </div>
  );
}
