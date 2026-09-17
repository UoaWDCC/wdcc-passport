"use client";

import { addUserBadgeMutation } from "@/hooks/badges/query-options";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function ScannerComponent({ initialCode }: { initialCode?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const lastSubmitted = useRef("");
  const [code, setCode] = useState(initialCode ?? "");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const {
    mutate: addUserBadge,
    data,
    error,
    isPending,
    reset,
  } = useMutation(
    addUserBadgeMutation({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["get-user-badges"] });
        void queryClient.invalidateQueries({ queryKey: ["get-user-pack-count"] });
      },
    }),
  );

  function submitCode(value: string) {
    addUserBadge(value);
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
        paused={isPending || data !== undefined}
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

      {error && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
          {error.message || "Could not add badge."}
        </p>
      )}

      <ConfirmDialog
        open={data !== undefined}
        message={
          data?.alreadyAwarded ? "You have already scanned this badge." : "Badge and pack added!"
        }
        confirmLabel="Go home"
        cancelLabel="Scan another"
        onConfirm={() => router.push("/home")}
        onCancel={() => {
          reset();
          setCode("");
          lastSubmitted.current = "";
        }}
      />
    </div>
  );
}
