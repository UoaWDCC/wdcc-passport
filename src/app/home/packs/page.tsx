import { PacksViewer } from "@/components/packs/PacksViewer";
import { requireUser } from "@/lib/access";

export default async function PacksPage() {
  await requireUser();
  return <PacksViewer />;
}
