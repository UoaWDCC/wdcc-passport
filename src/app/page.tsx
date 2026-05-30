import SignIn from "@/components/SignIn";

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ error?: string | string[] }>;
}) {
	const { error } = await searchParams;
	const errorMessage = typeof error === "string" ? error : null;
	return <SignIn error={errorMessage} />;
}
