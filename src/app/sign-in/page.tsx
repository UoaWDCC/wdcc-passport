"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-black px-6 py-16">
      <section className="w-full max-w-xl rounded-[2rem] border border-white/15 bg-white/5 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
          Sign In
        </p>
        <h1
          className="mt-4 text-4xl font-semibold tracking-tight text-white"
          style={{
            fontFamily:
              '"Avenir Next Condensed", "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
          }}
        >
          Auth is the next piece to wire up
        </h1>
        <p className="mt-4 text-base leading-7 text-white/75">
          Sign in with your Google account to continue to the WDCC calendar.
        </p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="mt-8 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Sign in with Google
        </button>
      </section>
    </main>
  );
}
