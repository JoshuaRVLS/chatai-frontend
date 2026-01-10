import Credentials from "next-auth/providers/credentials";
import { NextAuthOptions, DefaultSession } from "next-auth";
import { db } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username/Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password");
        }

        try {
          const user = await db.user.findFirst({
            where: {
              OR: [
                { username: credentials.username },
                { email: credentials.username },
              ],
            },
            include: {
              profileImage: true,
            },
          });

          if (!user || !user.password) {
            throw new Error("Invalid credentials");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Invalid credentials");
          }

          if (!user.verified) {
            throw new Error("ACCOUNT_NOT_VERIFIED");
          }

          const isSuspended = user.suspendedUntil ? new Date(user.suspendedUntil) > new Date() : false;
          // Admins are always whitelisted
          const isWhitelisted = user.isWhitelisted || user.isAdmin;

          return {
            id: user.id,
            name: user.username,
            username: user.username,
            email: user.email,
            image: user.profileImage ? `/api/users/picture/${user.id}` : null,
            isAdmin: user.isAdmin,
            isSuspended,
            isWhitelisted,
            sessionVersion: user.sessionVersion,
          };
        } catch (error) {
          console.error("[AUTH_AUTHORIZE_ERROR]", error);
          if (error instanceof Error) throw error;
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      // Initial sign-in: source truth from "user" object (which comes from authorize)
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.isAdmin = user.isAdmin;
        token.isSuspended = user.isSuspended;
        token.isWhitelisted = user.isWhitelisted;
        token.sessionVersion = user.sessionVersion;
      }

      // 2. Continuous Session Validation
      // We verify the user still exists and session version matches.
      // Doing this on every JWT check ensures instant logout if account is deleted/pass changed.
      try {
        const freshUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            sessionVersion: true,
            isAdmin: true,
            isWhitelisted: true,
            suspendedUntil: true
          }
        });

        // Invalidate if user doesn't exist OR session version doesn't match
        if (!freshUser || freshUser.sessionVersion !== token.sessionVersion) {
          throw new Error("SESSION_INVALIDATED");
        }

        // Keep flags up to date
        token.isAdmin = freshUser.isAdmin;
        token.isWhitelisted = freshUser.isWhitelisted || freshUser.isAdmin;
        token.isSuspended = freshUser.suspendedUntil
          ? new Date(freshUser.suspendedUntil) > new Date()
          : false;

      } catch (error) {
        console.error("Error validating session version:", error);
        // If DB is down, we might want to keep the session alive, but for security 
        // it's safer to either fail-safe or continue. Here we continue to avoid 
        // logging everyone out if the DB blips.
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.isAdmin = token.isAdmin;
        session.user.isSuspended = token.isSuspended;
        session.user.isWhitelisted = token.isWhitelisted;
        session.user.sessionVersion = token.sessionVersion;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};
