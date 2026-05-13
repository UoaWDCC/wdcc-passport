import { getCurrentUserAccess } from "@/lib/access";

export default async function UserPage() {
  await getCurrentUserAccess();
  return <p> user page</p>;
}
