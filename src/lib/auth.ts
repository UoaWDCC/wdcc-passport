import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db/client";
import { user, account, session, verification } from "@/lib/db/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user,
			account,
			session,
			verification
		}
	}),
	user: {
		additionalFields: {
			role: {
				type: ["user", "admin"],
				required: false,
				defaultValue: "user",
				input: false,
			},
		},
  	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			prompt: "select_account",
		},
	},
});
