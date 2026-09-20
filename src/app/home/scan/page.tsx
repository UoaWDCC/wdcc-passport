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
    <div className="flex flex-col gap-3 py-3 text-white [text-shadow:2px_2px_0_#000]">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-sm">Scan</h1>
      </header>
      <ScannerComponent initialCode={typeof code === "string" ? code : undefined} />
    </div>
  );
}
