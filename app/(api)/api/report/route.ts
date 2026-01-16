import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/auth";
import { db } from "@/app/utils/prisma";
import { sendEmail } from "@/app/utils/email";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { reason, details, targetUserId, targetCharacterId } = body;

        if (!reason) {
            return new NextResponse("Reason is required", { status: 400 });
        }

        // Ensure at least one target is present
        if (!targetUserId && !targetCharacterId) {
            return new NextResponse("Target (User or Character) is required", { status: 400 });
        }

        const report = await db.report.create({
            data: {
                reason,
                details,
                reporterId: session.user.id,
                targetCharacterId,
                status: "PENDING",
            },
        });

        // Send confirmation email to reporter
        if (session.user.email) {
            await sendEmail({
                to: session.user.email,
                subject: "Report Received - JChatAI",
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #333;">Report Received</h1>
                        <p>Hello,</p>
                        <p>We have received your report regarding <strong>${reason}</strong>.</p>
                        <p>Our moderation team will review it shortly. Thank you for helping keep JChatAI safe.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">Report ID: ${report.id}</p>
                    </div>
                `
            });
        }

        return NextResponse.json({ success: true, report });
    } catch (error) {
        console.error("Report submission error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to submit report" },
            { status: 500 }
        );
    }
}
