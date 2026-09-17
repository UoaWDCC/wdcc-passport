import Link from "next/link";
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
    <div className="flex flex-col gap-6">
      <Link
        href="/home"
        className="self-start rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        ← Back
      </Link>
      <ScannerComponent initialCode={typeof code === "string" ? code : undefined} />
    </div>
  );
}
