"use server";

import { requireAdmin, requireUser } from "@/lib/access";
import { addUserBadge, createUserBadge } from "./mutations";
import { getMatchingBadge, getUserBadges } from "./queries";
import { addUserPack } from "../packs/mutation";

export async function createBadgeAction(formData: FormData) {
  await requireAdmin();

  await createUserBadge(formData);
}

export async function getUserBadgesAction() {
  const session = await requireUser();

  return await getUserBadges(session.user.id);
}

export async function addUserBadgeAction(code: string) {
  const session = await requireUser();
  const badgeId = await getMatchingBadge(code);
  const result = await addUserBadge(session.user.id, badgeId);

  return result;
}
