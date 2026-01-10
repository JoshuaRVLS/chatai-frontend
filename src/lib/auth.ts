import { db } from "./prisma";
import Credentials from "next-auth/providers/credentials";
import { NextAuthOptions, DefaultSession } from "next-auth";
import bcrypt from "bcryptjs";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            username: string;
            isAdmin: boolean;
            sessionVersion: number;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        username: string;
        isAdmin: boolean;
        sessionVersion: number;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        username: string;
        isAdmin: boolean;
        sessionVersion: number;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username/Email", type: "text" },
                password: { label: "Password", type: "password" },
                token: { label: "Security Token", type: "text" },
            },
            authorize: async (credentials) => {
                if (!credentials?.username || !credentials?.password || !credentials?.token) {
                    throw new Error("Missing required credentials");
                }

                // 1. Verify Security Token Layer
                const securitySetting = await db.systemSetting.findUnique({
                    where: { key: 'ADMIN_SECURITY_TOKEN' }
                });

                if (!securitySetting) {
                    throw new Error("SYSTEM_UNINITIALIZED");
                }

                const isTokenValid = await bcrypt.compare(credentials.token, securitySetting.value);
                if (!isTokenValid) {
                    throw new Error("INVALID_SECURITY_TOKEN");
                }

                // 2. Verify User Identity
                const user = await db.user.findFirst({
                    where: {
                        OR: [
                            { username: credentials.username },
                            { email: credentials.username },
                        ],
                    },
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    throw new Error("Invalid credentials");
                }

                // 3. Verify Admin Authorization
                if (!user.isAdmin) {
                    throw new Error("ACCESS_DENIED");
                }

                return {
                    id: user.id,
                    name: user.username,
                    username: user.username,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    sessionVersion: user.sessionVersion,
                };
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
        jwt: async ({ token, user }) => {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.isAdmin = user.isAdmin;
                token.sessionVersion = user.sessionVersion;
            }

            // Continuous Session Validation
            try {
                const freshUser = await db.user.findUnique({
                    where: { id: token.id },
                    select: {
                        sessionVersion: true,
                        isAdmin: true,
                    }
                });

                if (!freshUser || freshUser.sessionVersion !== token.sessionVersion || !freshUser.isAdmin) {
                    throw new Error("SESSION_INVALIDATED");
                }

                token.isAdmin = freshUser.isAdmin;
            } catch (error) {
                console.error("Admin session validation error:", error);
                // Fail-safe: if it's explicitly invalidated, it will throw. 
                // We keep it throwing to ensure admin security.
                if (error instanceof Error && error.message === "SESSION_INVALIDATED") throw error;
            }

            return token;
        },
        session: async ({ session, token }) => {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.username = token.username;
                session.user.isAdmin = token.isAdmin;
                session.user.sessionVersion = token.sessionVersion;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
};
