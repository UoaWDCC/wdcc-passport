import { BadgesSection } from "@/components/home/BadgesSection";
import { MobileHome } from "@/components/home/MobileHome";
import { SectionHeader } from "@/components/home/SectionHeader";
import { requireUser } from "@/lib/access";
import { SignOutButton } from "@/components/SignOutButton";
import Link from "next/link";

export default async function Home() {
  const { user } = await requireUser();
  const name = (user.name ?? "").trim() || "there";
  const firstName = name.split(" ")[0];

  return (
    <>
      <MobileHome />
      <div className="hidden flex-col gap-10 md:flex">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl leading-none font-semibold md:text-4xl">
              Welcome, {firstName}!
            </h1>
            <p className="mt-2 text-base leading-7 text-white/75">
              Show up to events to collect badges, cards and packs.
            </p>
          </div>
          <Link
            href="/home/scan"
            className="self-start rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Scan QR
          </Link>
          <SignOutButton />
        </header>

        <BadgesSection />

        <section>
          <SectionHeader title="Cards" />
        </section>

        <section>
          <SectionHeader title="Packs" />
        </section>
      </div>
    </>
  );
}
