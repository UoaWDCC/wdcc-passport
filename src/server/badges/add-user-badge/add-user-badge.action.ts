"use server"

import { requireUser } from "@/lib/access";
import { addUserBadge } from "./add-user-badge.service";

export async function addUserBadgeAction(badgeId: string) {
    const session = await requireUser();
    return addUserBadge(session.user.id, badgeId);
}