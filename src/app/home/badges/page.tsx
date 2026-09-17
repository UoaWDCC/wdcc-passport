import { BadgesScreen } from "@/components/badges/BadgesScreen";
import { requireUser } from "@/lib/access";

export const metadata = { title: "Badges · WDCC Passport" };

export default async function BadgesPage() {
  await requireUser();

  return <BadgesScreen />;
}
