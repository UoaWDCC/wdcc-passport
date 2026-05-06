import { getCurrentUserAccess } from "@/lib/access";

export default async function AdminPage() {
  await getCurrentUserAccess();
  return <p> admin page</p>;
}
