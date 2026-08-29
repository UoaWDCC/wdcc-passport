"use server";

import { requireAdmin, requireUser } from "@/lib/access";
import { addUserBadge, createUserBadge } from "./mutations";
import { getUserBadges } from "./queries";

export async function createBadgeAction(formData: FormData) {
  await requireAdmin();

  await createUserBadge(formData);
}

export async function getUserBadgesAction() {
  const session = await requireUser();

  return await getUserBadges(session.user.id);
}

export async function addUserBadgeAction(userId: string, badgeId: string) {
  await requireAdmin();

  return await addUserBadge(userId, badgeId);
}
