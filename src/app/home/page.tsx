import { HomeScreen } from "@/components/home/HomeScreen";
import { requireUser } from "@/lib/access";

export default async function Home() {
  await requireUser();

  return <HomeScreen />;
}
