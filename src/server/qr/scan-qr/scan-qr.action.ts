"use server";

import { requireUser } from "@/lib/access";
import { addUserBadge } from "@/server/badges/add-user-badge/add-user-badge.service";
import { getMatchingBadge } from "./scan-qr.service";

export async function scanQrAction(code: string) {
  const session = await requireUser();
  if (!code || typeof code !== "string") {
    throw new Error("Invalid QR code");
  }
  code = code.trim().toLowerCase();

  const badgeId = await getMatchingBadge(code);

  return addUserBadge(session.user.id, badgeId);
}
