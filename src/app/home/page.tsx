import { requireUser } from "@/lib/access";
import { getUserBadges } from "@/server/badges/get-user-badges/get-user-badges.server";

export default async function Home() {
  const session = await requireUser();
  const badges = await getUserBadges(session.user.id);

  return (
    <main>
      <h1>Test JSON</h1>
        {JSON.stringify(badges, null, 2)}
    </main>
  );
}