import { ScannerComponent } from "@/components/scan/Scanner";
import { requireUser } from "@/lib/access";

export default async function ScanPage() {
  const session = await requireUser();
  return <ScannerComponent />;
}
