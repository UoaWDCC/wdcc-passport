"use server";

import { getUserBadges } from "@/server/badges/get-user-badges/get-user-badges.service";
import { requireUser } from "@/lib/access";


export async function getUserBadgesAction() {
  const session = await requireUser();
  return await getUserBadges(session.user.id);
}

export async function GET() {
  return getUserBadgesAction();
}
