import { getUserBadgesAction } from "@/server/badges/get-user-badges/get-user-badges.action";

export default async function Home() {
  const badges = await getUserBadgesAction();

  return (
    <main>
      <h1>Test JSON</h1>
      <pre>{JSON.stringify(badges, null, 2)}</pre>
    </main>
  );
}