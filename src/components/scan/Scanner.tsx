"use client";

import { addUserBadgeMutation } from "@/hooks/badges/query-options";
import { useMutation } from "@tanstack/react-query";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function ScannerComponent() {
  const router = useRouter();
  const lastSubmitted = useRef("");
  const [code, setCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { mutate: addUserBadge, data, error, isPending, reset } = useMutation(addUserBadgeMutation());

  function submitCode(value: string) {
    addUserBadge(value, {
      onSuccess: ({ alreadyAwarded }) => {
        if (!alreadyAwarded) router.push("/home");
      },
    });
  }

  function handleScan(scannedCode: string) {
    const parsed = scannedCode.trim().slice(-6);
     if (parsed === lastSubmitted.current) return;
    reset();
    lastSubmitted.current = parsed;
    setCode(parsed);
    submitCode(parsed);
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
        onError={(scannerError) =>
          setCameraError(
            scannerError.kind === "permission-denied"
              ? "Camera access was denied — allow it in your browser, or type the code below."
              : "Camera unavailable — type the code below instead.",
          )
        }
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
        onClick={() => submitCode(code)}
        disabled={isPending || code.trim() === ""}
        className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? "Adding badge…" : "Add badge"}
      </button>

      {cameraError && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
          {cameraError}
        </p>
      )}

      {data?.alreadyAwarded && !isPending && (
        <p className="rounded-lg bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700">
          You already have this badge.
        </p>
      )}

      {error && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
          {error.message || "Could not add badge."}
        </p>
      )}
    </div>
  );
}
