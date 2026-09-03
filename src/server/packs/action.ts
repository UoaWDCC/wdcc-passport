"user server"

import { requireUser } from "@/lib/access";
import { addUserPack } from "./mutation";

export async function addUserPackAction() {
    const session = await requireUser();
    await addUserPack(session.user.id);
}