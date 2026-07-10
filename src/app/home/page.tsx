import { BadgesSection } from "@/components/home/BadgesSection";
import { CreateBadgeButton } from "@/components/CreateBadgeButton";
export default async function Home() {
  return (
    <main>
      <h1>Home</h1>
      <BadgesSection />
      <CreateBadgeButton />
    </main>
  );
}
