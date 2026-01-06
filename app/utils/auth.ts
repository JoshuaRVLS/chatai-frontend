import Credentials from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { db } from "./prisma";
import bcrypt from "bcryptjs";

type UserInput = {
  username: string;
  password: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      credentials: {},
      authorize: async (credentials) => {
        const creds = credentials as Record<string, string> | undefined;
        if (!creds?.username || !creds?.password) {
          throw new Error("Username and password required");
        }

        try {
          const user = await db.user.findFirst({
            where: {
              OR: [
                { username: creds.username },
                { email: creds.username },
              ],
            },
            include: {
              profileImage: true,
            },
          });

          if (!user) {
            throw new Error("Invalid username or password");
          }

          const isValid = await bcrypt.compare(creds.password, user.password);
          if (!isValid) {
            throw new Error("Invalid username or password");
          }

          if (!user.verified) {
            throw new Error("Please activate your account first");
          }

          return {
            id: user.id,
            name: user.username,
            username: user.username,
            image: user.profileImage ? `/api/users/picture/${user.id}` : null,
          };
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error("An unknown error occurred");
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.user = user;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user = token.user as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Custom sign-in page
    error: "/login", // Redirect to login page on errors
  },
};
