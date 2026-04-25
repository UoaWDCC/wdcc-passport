import Link from "next/link";

const displayFont =
  '"Avenir Next Condensed", "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif';

export default function UserSidePage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-16 text-black">
      <section className="w-full max-w-2xl rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.12)] md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-black/60">
          User Side
        </p>
        <h1
          className="mt-4 text-4xl font-semibold tracking-tight"
          style={{ fontFamily: displayFont }}
        >
          Student-facing app placeholder
        </h1>
        <p className="mt-4 text-base leading-7 text-black/70">
          This is the route for signed-in users browsing events, RSVPs, and
          attendance. The root route now sends authenticated non-admin users
          here instead of to a generic calendar page.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-full border border-black/20 px-5 py-3 text-sm font-semibold text-black transition hover:border-black"
        >
          Back to landing page
        </Link>
      </section>
    </main>
  );
}
