import "next-auth";
import "next-auth/jwt";

export type AuthRole = "admin" | "user" | "no_role";

declare module "next-auth" {
  interface Session {
    user: {
      user_id?: number;
      role?: AuthRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user_id?: number;
    role?: AuthRole;
  }
}
