import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      isAdmin: boolean;
      isSuspended: boolean;
      isWhitelisted: boolean;
      sessionVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    isAdmin: boolean;
    isSuspended: boolean;
    isWhitelisted: boolean;
    sessionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    isAdmin: boolean;
    isSuspended: boolean;
    isWhitelisted: boolean;
    sessionVersion: number;
  }
}
