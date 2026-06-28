import { BadgesSection } from "@/components/home/BadgesSection";
import { TestBadgeButton } from "@/components/test-badge-button"
export default async function Home() {
  return (
    <main>
      <h1>Home</h1>
      <BadgesSection />
      <TestBadgeButton />
    </main>
  );
}
