import Link from "next/link";

const displayFont =
  '"Avenir Next Condensed", "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif';

export default function AdminSidePage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-black px-6 py-16 text-white">
      <section className="w-full max-w-2xl rounded-[2rem] border border-white/12 bg-white/5 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
          Admin Side
        </p>
        <h1
          className="mt-4 text-4xl font-semibold tracking-tight"
          style={{ fontFamily: displayFont }}
        >
          Club-admin app placeholder
        </h1>
        <p className="mt-4 text-base leading-7 text-white/75">
          This is the route for club admins managing events, visibility, and
          attendance workflows. Once role resolution is wired to the database,
          admin users can be redirected here from the landing page automatically.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
        >
          Back to landing page
        </Link>
      </section>
    </main>
  );
}
