import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const POST = async (req: Request) => {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { success: false, message: "Email or Username is required" },
                { status: 400 }
            );
        }

        const user = await db.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: email }
                ]
            },
        });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        if (user.verified) {
            return NextResponse.json(
                { success: false, message: "Account already verified" },
                { status: 400 }
            );
        }

        const baseUrl = new URL(req.url).origin;

        // Reuse existing token if valid, or generate new one?
        // For simplicity and security (if token lost), let's use the existing valid one or the one we just generated in register?
        // Actually, if we just registered, we have a token.
        // But if it expired, we might need a new one.
        // Let's check expiration.

        let verificationToken = user.verificationToken;

        if (!verificationToken || !user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
            // Generate new token
            verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
            const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await db.user.update({
                where: { id: user.id },
                data: {
                    verificationToken,
                    verificationTokenExpires
                }
            });
        }

        // Call send-verification API
        // We use internal fetch to our own API to reuse the email logic
        const response = await fetch(`${baseUrl}/api/send-verification`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Forward headers if needed for rate limiting? 
                // Actually send-verification rate limits by IP.
                // We might want to pass the original IP? 
                // For now, let's just call it.
            },
            body: JSON.stringify({
                email: user.email,
                verificationToken,
            }),
        });

        if (!response.ok) {
            const data = await response.json();
            // If rate limited
            if (response.status === 429) {
                return NextResponse.json(
                    { success: false, message: data.message || "Too many requests. Please wait." },
                    { status: 429 }
                );
            }
            throw new Error("Failed to send email");
        }

        return NextResponse.json({
            success: true,
            message: "Verification code resent successfully",
        });

    } catch (error) {
        console.error("Resend verification error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
};
