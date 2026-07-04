import { BadgesSection } from "@/components/home/BadgesSection";
import { SectionHeader } from "@/components/home/SectionHeader";
import { requireUser } from "@/lib/access";

export default async function Home() {
  const { user } = await requireUser();
  const name = user.name.trim() || "there";
  const firstName = name.split(" ")[0];

  return (
    <div className="flex flex-col gap-10">
      <header className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl leading-none font-semibold md:text-4xl">Welcome, {firstName}!</h1>
          <p className="mt-2 text-base leading-7 text-white/75">
            Show up to events to collect badges, cards and packs.
          </p>
        </div>
      </header>

      <BadgesSection />

      <section>
        <SectionHeader title="Cards" />
      </section>

      <section>
        <SectionHeader title="Packs" />
      </section>
    </div>
  );
}
