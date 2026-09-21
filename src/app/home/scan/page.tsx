import { ScannerComponent } from "@/components/scan/Scanner";
import { requireUser } from "@/lib/access";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  await requireUser();
  const { code } = await searchParams;
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden py-3 text-white [text-shadow:2px_2px_0_#000] sm:h-auto sm:overflow-visible">
      <header className="scan-title flex shrink-0 items-center justify-between gap-2">
        <h1 className="text-sm">Scan</h1>
      </header>
      <ScannerComponent initialCode={typeof code === "string" ? code : undefined} />
    </div>
  );
}
