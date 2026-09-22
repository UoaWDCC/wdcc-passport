"use client";

import { addUserBadgeMutation } from "@/hooks/badges/query-options";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { usePackAdded } from "@/components/home/HomeNav";
import { PIXEL_ERROR_TEXT, PIXEL_INPUT, PIXEL_PANEL, pixelButton } from "@/components/ui/pixel";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function ScannerComponent({ initialCode }: { initialCode?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const lastSubmitted = useRef("");
  const { setPackAdded } = usePackAdded();
  const [code, setCode] = useState(initialCode ?? "");
  const [isEnteringCode, setIsEnteringCode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const {
    mutate: addUserBadge,
    data,
    error,
    isPending,
    reset,
  } = useMutation({
    ...addUserBadgeMutation(),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["get-user-badges"] });
      void queryClient.invalidateQueries({ queryKey: ["get-user-pack-count"] });
      if (!result.alreadyAwarded) setPackAdded(true);
    },
  });

  function submitCode(value: string) {
    if (isPending || value.trim().length !== 6) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
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
    <div className="flex min-h-0 flex-1 flex-col items-center gap-2 sm:flex-none sm:justify-center">
      <div className="scan-camera [container-type:size] flex min-h-0 w-full max-w-[340px] flex-1 justify-center overflow-hidden sm:[container-type:normal] sm:aspect-square sm:w-[min(340px,40dvh)] sm:flex-none">
        <Scanner
          paused={isEnteringCode || isPending || data !== undefined}
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
          components={{ finder: false }}
          styles={{
            container: {
              width: "var(--scanner-size, min(340px, 40dvh))",
              height: "var(--scanner-size, min(340px, 40dvh))",
            },
          }}
          classNames={{
            container: "overflow-hidden rounded-3xl border-4 border-black",
          }}
        />
      </div>

      <form
        data-code-form
        className="flex w-full shrink-0 flex-col items-center gap-2"
        onFocusCapture={() => setIsEnteringCode(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsEnteringCode(false);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          submitCode(code);
        }}
      >
        <label htmlFor="code-input" className="text-[10px] text-white [text-shadow:2px_2px_0_#000]">
          Badge code
        </label>
        <input
          id="code-input"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          enterKeyHint="done"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          placeholder="Or type the code here"
          className={`${PIXEL_INPUT} max-w-sm text-center tracking-[0.3em] uppercase placeholder:text-[10px] placeholder:tracking-normal placeholder:normal-case max-sm:text-base!`}
        />

        <button
          type="submit"
          onPointerDown={(event) => event.preventDefault()}
          disabled={isPending || code.trim().length !== 6}
          className={pixelButton({ variant: "gold" })}
        >
          {isPending ? "Adding badge…" : "Add badge"}
        </button>
      </form>

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
        confirmLabel="Go to packs"
        cancelLabel="Go to badges"
        onConfirm={() => router.push("/home/packs")}
        onCancel={() => router.push("/home/badges")}
      />
    </div>
  );
}
