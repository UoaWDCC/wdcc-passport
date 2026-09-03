import { ScannerComponent } from "@/components/scan/Scanner";
import { requireUser } from "@/lib/access";

export default async function ScanPage() {
  await requireUser();
  return <ScannerComponent />;
}
