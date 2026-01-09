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
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        username: string;
        isAdmin: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        username: string;
        isAdmin: boolean;
    }
}

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

                // Check if user is admin
                if (!user.isAdmin) {
                    throw new Error("ACCESS_DENIED");
                }

                return {
                    id: user.id,
                    name: user.username,
                    username: user.username,
                    email: user.email,
                    isAdmin: user.isAdmin,
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
            }
            return token;
        },
        session: async ({ session, token }) => {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.username = token.username;
                session.user.isAdmin = token.isAdmin;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
};
