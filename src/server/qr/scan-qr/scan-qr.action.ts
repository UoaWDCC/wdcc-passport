"use server";

import { requireUser } from "@/lib/access";
import { addUserBadge } from "@/server/badges/add-user-badge/add-user-badge.service";
import { scanQr } from "./scan-qr.service";

export async function scanQrAction(code: string) {
  code = code.trim().toLowerCase();
  const session = await requireUser();

  const { badge } = await scanQr(code);
  const { alreadyAwarded } = await addUserBadge(session.user.id, badge.id);

  return { badge, alreadyAwarded };
}
