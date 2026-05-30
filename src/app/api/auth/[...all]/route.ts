import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

type AuthHandler = (request: Request) => Promise<Response>;

const handlers = toNextJsHandler(auth);

const withCookieLog =
	(handler: AuthHandler): AuthHandler =>
	async (request) => {
		const response = await handler(request);
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
