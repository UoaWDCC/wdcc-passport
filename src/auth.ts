import { eq } from "drizzle-orm";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { AuthRole } from "@/types/next-auth";

const googleClientId =
  process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "";
const sessionMaxAge = 30 * 60;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: sessionMaxAge,
  },
  jwt: {
    maxAge: sessionMaxAge,
  },
  callbacks: {
    async signIn({ user }) {
      return Boolean(user.email);
    },
    async jwt({ token, user }) {
      token.role ??= "no_role";

      // Re-check on sign-in
      if (user) {
        const email = user.email;
        if (email) {
          const { db, users, adminOf } = await import("@/db");

          const [dbUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          let userId = dbUser?.id;
          let role: AuthRole = "user";

          if (!dbUser) {
            const [newUser] = await db
              .insert(users)
              .values({
                email,
              })
              .returning({ id: users.id });

            userId = newUser.id;
          } else {
            const [adminClub] = await db
              .select({ clubId: adminOf.clubId })
              .from(adminOf)
              .where(eq(adminOf.userId, dbUser.id))
              .limit(1);
            role = adminClub ? "admin" : "user";
          }

          token.user_id = userId;
          token.role = role;
        }
        delete token.email;
        delete token.name;
        delete token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.user_id = token.user_id;
      session.user.role = token.role ?? "no_role";
      return session;
    },
  },
};
