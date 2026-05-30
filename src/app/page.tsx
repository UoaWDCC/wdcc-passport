import { redirect } from "next/navigation";

import LandingPage from "@/components/LandingPage";
// import { getSignedInDestination } from "@/lib/access";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  // const signedInDestination = await getSignedInDestination();

  // if (signedInDestination) {
  //   redirect(signedInDestination);
  // }

  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? error : null;
  return <LandingPage error={errorMessage} />;
}