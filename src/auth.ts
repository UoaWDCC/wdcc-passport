import { eq } from "drizzle-orm";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const googleClientId =
  process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      return Boolean(user.email);
    },
    async jwt({ token, user }) {
      // Re-check on sign-in or while still pending sign-up
      if (user || token.role === "needs-sign-up") {
        const email = token.email;
        if (email) {
          const { db, users, adminOf } = await import("@/db");

          const [dbUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!dbUser) {
            token.role = "needs-sign-up";
          } else {
            const [adminClub] = await db
              .select({ clubId: adminOf.clubId })
              .from(adminOf)
              .where(eq(adminOf.userId, dbUser.id))
              .limit(1);
            token.role = adminClub ? "admin" : "user";
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role as string;
      return session;
    },
  },
};
