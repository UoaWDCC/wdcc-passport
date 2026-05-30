import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { session, user } from "@/lib/db/schema";
import { toNextJsHandler } from "better-auth/next-js";
import { eq } from "drizzle-orm";

type AuthHandler = (request: Request) => Promise<Response>;

const SESSION_COOKIE_NAME = "better-auth.session_token";
const ROLE_COOKIE_NAME = "role";

const handlers = toNextJsHandler(auth);

const withCookieLog =
	(handler: AuthHandler): AuthHandler =>
	async (request) => {
		const response = await handler(request);
		await syncRoleCookie(response);
		const headers = response.headers as Headers & {
			getSetCookie?: () => string[];
		};
		const setCookieHeaders =
			headers.getSetCookie?.() ??
			(response.headers.get("set-cookie")
				? [response.headers.get("set-cookie")!]
				: []);

		if (setCookieHeaders.length > 0) {
			console.log(
				"[auth] cookie created",
				setCookieHeaders.map((cookie) => cookie.split("=")[0]),
			);
		}

		return response;
	};

export const GET = withCookieLog(handlers.GET);
export const POST = withCookieLog(handlers.POST);

async function syncRoleCookie(response: Response) {
	const sessionCookie = getSetCookieHeaders(response).find(isSessionCookie);

	if (!sessionCookie) {
		return;
	}

	if (isDeletedCookie(sessionCookie)) {
		response.headers.append("Set-Cookie", deleteRoleCookie());
		return;
	}

	const sessionToken = getUnsignedCookieValue(sessionCookie);

	if (!sessionToken) {
		return;
	}

	const role = await getUserRoleBySessionToken(sessionToken);

	if (!role) {
		response.headers.append("Set-Cookie", deleteRoleCookie());
		return;
	}

	response.headers.append("Set-Cookie", serializeRoleCookie(role));
}

function getSetCookieHeaders(response: Response): string[] {
	const headers = response.headers as Headers & {
		getSetCookie?: () => string[];
	};

	return (
		headers.getSetCookie?.() ??
		(response.headers.get("set-cookie")
			? [response.headers.get("set-cookie")!]
			: [])
	);
}

function isSessionCookie(cookie: string): boolean {
	const cookieName = cookie.split("=")[0]?.replace(/^__(Secure|Host)-/, "");
	return cookieName === SESSION_COOKIE_NAME;
}

function getUnsignedCookieValue(cookie: string): string | null {
	const rawValue = cookie.split(";")[0]?.split("=").slice(1).join("=");

	if (!rawValue) {
		return null;
	}

	const value = decodeURIComponent(rawValue);
	const signatureStart = value.lastIndexOf(".");

	if (signatureStart < 1) {
		return null;
	}

	return value.slice(0, signatureStart);
}

function isDeletedCookie(cookie: string): boolean {
	return /;\s*Max-Age=0(?:;|$)/i.test(cookie);
}

async function getUserRoleBySessionToken(token: string): Promise<"admin" | "user" | null> {
	const rows = await db
		.select({ role: user.role })
		.from(session)
		.innerJoin(user, eq(session.userId, user.id))
		.where(eq(session.token, token))
		.limit(1);

	const role = rows[0]?.role;

	return role === "admin" || role === "user" ? role : "user";
}

function serializeRoleCookie(value: string): string {
	const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

	return `${ROLE_COOKIE_NAME}=${encodeURIComponent(
		value,
	)}; Path=/; SameSite=Lax${secure}`;
}

function deleteRoleCookie(): string {
	const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

	return `${ROLE_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
