import { getCurrentUserAccess } from "@/lib/access";
import { redirect } from "next/navigation";

export default async function UserPage() {
  await getCurrentUserAccess();
  redirect("/user/calendar");
}
