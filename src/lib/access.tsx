import { cookies } from "next/headers";

export type UserRole = "admin" | "user";

const ROLE_COOKIE_NAME = "role";

export async function getUserRole(): Promise<UserRole | null> {
	const role = (await cookies()).get(ROLE_COOKIE_NAME)?.value;

	return role === "admin" || role === "user" ? role : null;
}
