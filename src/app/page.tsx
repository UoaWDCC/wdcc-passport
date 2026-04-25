import { redirect } from "next/navigation";

import LandingPage from "@/components/LandingPage";
import { getSignedInDestination } from "@/lib/access";

export default async function Home() {
  const signedInDestination = await getSignedInDestination();

  if (signedInDestination) {
    redirect(signedInDestination);
  }

  return <LandingPage />;
}
