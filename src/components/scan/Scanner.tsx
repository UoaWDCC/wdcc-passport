"use client";

import { addUserBadgeMutation } from "@/hooks/badges/query-options";
import { useMutation } from "@tanstack/react-query";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ScannerComponent() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const {
    mutate: addUserBadge,
    error,
    isPending,
  } = useMutation(addUserBadgeMutation({ onSuccess: () => router.push("/home") }));

  function handleScan(scannedCode: string) {
    scannedCode = scannedCode.trim().slice(scannedCode.length-6, scannedCode.length);
    setCode(scannedCode);
    addUserBadge(scannedCode);
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Scanner
       paused={isPending}
        onScan={(codes) => {
          if (codes[0]) {
            handleScan(codes[0].rawValue);
          }
        }}

        classNames={{
          container: "w-full max-w-sm overflow-hidden rounded-3xl",
        }}
      />

      <label htmlFor="code-input" className="text-sm text-white/75">
        Badge code
      </label>
      <input
        id="code-input"
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Or type the code here"
        className="rounded-lg bg-white/10 px-3 py-2 text-white"
      />

      <button
        type="button"
        onClick={() => addUserBadge(code)}
        disabled={isPending || code.trim() === ""}
        className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? "Adding badge…" : "Add badge"}
      </button>

      {error && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
          {error.message || "Could not add badge."}
        </p>
      )}
    </div>
  );
}
