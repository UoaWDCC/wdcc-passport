import { getUserBadges } from "@/server/badges/get-user-badges/get-user-badges.server";
import { requireUser } from "@/lib/access";

export async function GET() {
  const session = await requireUser();
  const badges = await getUserBadges(session.user.id);
  return new Response(JSON.stringify(badges), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
