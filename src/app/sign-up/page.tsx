import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-16 text-black">
      <section className="w-full max-w-xl rounded-lg border border-black/15 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.12)] md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-black/60">
          Sign Up
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Finish creating your account
        </h1>
        <p className="mt-4 text-base leading-7 text-black/70">
          {email} is signed in with Google, but it is not linked to a
          WDCC Calendar user account yet.
        </p>
      </section>
    </main>
  );
}
