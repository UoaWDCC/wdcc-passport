import { CardViewer } from "@/components/cards/CardViewer";
import { requireUser } from "@/lib/access";

export default async function CardsPage() {
  await requireUser();
  return <CardViewer />;
}
