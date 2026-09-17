"use client";

import { addUserBadgeMutation } from "@/hooks/badges/query-options";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PIXEL_ERROR_TEXT, PIXEL_INPUT, PIXEL_PANEL, pixelButton } from "@/components/ui/pixel";
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

      <label htmlFor="code-input" className="text-[10px] text-white [text-shadow:2px_2px_0_#000]">
        Badge code
      </label>
      <input
        id="code-input"
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Or type the code here"
        className={`${PIXEL_INPUT} max-w-sm text-center tracking-[0.3em] uppercase placeholder:text-[10px] placeholder:tracking-normal placeholder:normal-case`}
      />

      <button
        type="button"
        onClick={() => submitCode(code)}
        disabled={isPending || code.trim() === ""}
        className={pixelButton({ variant: "gold" })}
      >
        {isPending ? "Adding badge…" : "Add badge"}
      </button>

      {cameraError && (
        <p
          className={`max-w-sm px-4 py-3 text-[10px] leading-relaxed ${PIXEL_PANEL} ${PIXEL_ERROR_TEXT}`}
        >
          {cameraError}
        </p>
      )}

      {error && (
        <p
          className={`max-w-sm px-4 py-3 text-[10px] leading-relaxed ${PIXEL_PANEL} ${PIXEL_ERROR_TEXT}`}
        >
          {error.message || "Could not add badge."}
        </p>
      )}

      <ConfirmDialog
        pixel
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
