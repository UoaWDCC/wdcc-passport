"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function SignIn({ error: initialError }: { error: string | null }) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const error = localError ?? initialError;

  async function handleSignIn() {
    setLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/home",
        errorCallbackURL: "/?error=oauth",
      });

      if (error) {
        setLocalError("Sign in failed. Please try again.");
        setLoading(false);
      }
    } catch {
      setLocalError("Sign in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-gray-900 px-6 py-10 text-white">
      <div className="max-w-3xl">
        {error && (
          <div className="rounded-lg bg-red-100 px-4 py-3 text-center text-red-700">
            <p className="text-sm font-semibold">Sign in failed. Please try again.</p>
          </div>
        )}
        <h1 className="mt-5 text-5xl leading-none font-semibold text-white md:text-7xl">
          WDCC Passport
        </h1>
        <p className="mt-4 text-base leading-7 text-white/75">
          Sign in with your Google account to continue to the app.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="mt-8 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
