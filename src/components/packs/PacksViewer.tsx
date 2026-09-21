"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PackModal } from "@/components/packs/PackModal";
import { PIXEL_PANEL, pixelButton } from "@/components/ui/pixel";
import { getUserPackCountQuery, openPackMutation } from "@/hooks/packs/query-options";

export function PacksViewer() {
  const queryClient = useQueryClient();
  const { data: packCount = 0, isPending, error, refetch } = useQuery(getUserPackCountQuery());
  const [session, setSession] = useState(0);
  const {
    mutate: openPack,
    data: opened,
    error: openError,
    reset,
  } = useMutation(
    openPackMutation({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["get-user-pack-count"] });
        void queryClient.invalidateQueries({ queryKey: ["get-user-cards"] });
      },
    }),
  );

  return (
    <div className="flex h-full flex-col gap-3 py-3 text-white [text-shadow:2px_2px_0_#000]">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-sm">Packs</h1>
      </header>
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {isPending ? (
          <p role="status" className="py-6 text-center text-xs text-white/60">
            Loading packs...
          </p>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <p role="alert" className="text-xs text-red-300">
              Could not load packs.
            </p>
            <button
              type="button"
              className={pixelButton({ size: "sm" })}
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {packCount === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                <p
                  className={`max-w-xs px-4 py-3 text-center text-[10px] leading-relaxed ${PIXEL_PANEL}`}
                >
                  No packs yet. Scan a QR code at a WDCC event to earn one.
                </p>
              </div>
            )}
            <PackModal
              key={session}
              packCount={packCount}
              opened={opened}
              openError={openError !== null}
              onOpen={() => openPack()}
              onClose={() => {
                reset();
                setSession((value) => value + 1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
