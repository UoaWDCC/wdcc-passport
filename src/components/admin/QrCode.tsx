"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrCodeDisplayProps {
  eventName: string;
  code: string | null;
  onClose: () => void;
}

export function QrCodeDisplay({ eventName, code, onClose }: QrCodeDisplayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`QR code for ${eventName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-neutral-900 p-6 text-white"
      >
        <h2 className="text-lg font-semibold">{eventName}</h2>

        {code ? (
          <>
            <p className="text-sm text-white/75">Scan this QR code:</p>
            <div className="rounded-lg bg-white p-4">
              <QRCodeSVG
                value={`https://passport.wdcc.co.nz/home/scan?code=${code}`}
                size={256}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
              />
            </div>
            <p className="text-sm text-white/75">
              Or enter the code manually: <span className="font-mono font-semibold">{code}</span>
            </p>
          </>
        ) : (
          <p className="text-sm text-white/75">No badge is linked to this event yet.</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25"
        >
          Close
        </button>
      </div>
    </div>
  );
}
