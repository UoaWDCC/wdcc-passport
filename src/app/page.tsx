import SignIn from "@/components/SignIn";
import { safeRedirectPath } from "@/lib/access";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; next?: string | string[] }>;
}) {
  const { error, next } = await searchParams;
  const errorMessage = typeof error === "string" ? error : null;
  const redirectPath = safeRedirectPath(typeof next === "string" ? next : undefined);
  return <SignIn error={errorMessage} next={redirectPath} />;
}
