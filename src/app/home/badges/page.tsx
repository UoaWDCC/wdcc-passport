import { BadgesScreen } from "@/components/badges/BadgesScreen";
import { requireUser } from "@/lib/access";

export default async function BadgesPage() {
  await requireUser();

  return <BadgesScreen />;
}
