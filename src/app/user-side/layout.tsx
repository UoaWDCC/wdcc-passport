import { redirect } from "next/navigation";

import { getCurrentUserAccess } from "@/lib/access";

export default async function UserSideLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await getCurrentUserAccess();

  if (access.status === "signed-out") {
    redirect("/");
  }

  if (access.status === "needs-sign-up") {
    redirect("/sign-up");
  }

  return children;
}
