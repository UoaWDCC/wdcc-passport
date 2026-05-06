import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { eq, sql } from "drizzle-orm";
import { betterAuth } from "better-auth";

import {
  adminOf,
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
  db,
  users,
} from "@/db";

const googleClientId =
  process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "";
const sessionMaxAge = 30 * 60;

export type AppRole = "user" | "admin";

async function ensureAppUser(email: string) {
  const [row] = await db
    .insert(users)
    .values({ email })
    .onConflictDoUpdate({
      target: users.email,
      set: { email: sql`excluded.email` },
    })
    .returning({ id: users.id });

  return row.id;
}

async function getAppUserRole(appUserId: number): Promise<AppRole> {
  const [adminClub] = await db
    .select({ clubId: adminOf.clubId })
    .from(adminOf)
    .where(eq(adminOf.userId, appUserId))
    .limit(1);

  return adminClub ? "admin" : "user";
}

export const auth = betterAuth({
  appName: "WDCC Calendar",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authUsers,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
    },
  }),
  session: {
    expiresIn: sessionMaxAge,
    updateAge: 3 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      version: "2",
    },
    additionalFields: {
      ipAddress: {
        type: "string",
        required: false,
        fieldName: "ipAddress",
        returned: false,
      },
      userAgent: {
        type: "string",
        required: false,
        fieldName: "userAgent",
        returned: false,
      },
      appUserId: { type: "number", required: true, input: false },
      role: { type: "string", required: true, input: false },
    },
  },
  user: {
    additionalFields: {
      name: { type: "string", required: false, returned: false },
      image: { type: "string", required: false, returned: false },
    },
  },
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      prompt: "select_account",
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return { data: { ...user, name: undefined, image: undefined } };
        },
        after: async (user) => {
          await ensureAppUser(user.email);
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const [authUser] = await db
            .select({ email: authUsers.email })
            .from(authUsers)
            .where(eq(authUsers.id, session.userId))
            .limit(1);

          if (!authUser) return false;

          const appUserId = await ensureAppUser(authUser.email);
          const role = await getAppUserRole(appUserId);

          return { data: { ...session, appUserId, role } };
        },
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
