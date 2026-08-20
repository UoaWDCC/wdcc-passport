"use server";

import { requireUser } from "@/lib/access";
import { scanQr } from "./scan-qr.service";

export async function scanQrAction(code: string) {
  code = code.trim().toLowerCase();
  const session = await requireUser();

  return scanQr(code, session.user.id);
}