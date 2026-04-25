import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-black px-6 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.06),_transparent_30%)]" />
        <div className="max-w-3xl">
          <h1
            className="mt-5 text-5xl font-semibold leading-none text-white md:text-7xl"
          >
            WDCC Calendar
          </h1>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-semibold text-black transition hover:bg-white/90"
            >
              Get Started
            </Link>
          </div>
        </div>
    </main>
  );
}
