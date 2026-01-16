"use server";

import { db } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { ReportStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateReportStatus(reportId: string, status: ReportStatus) {
    try {
        const report = await db.report.findUnique({
            where: { id: reportId },
            include: { reporter: true },
        });

        if (!report) {
            return { success: false, error: "Report not found" };
        }

        await db.report.update({
            where: { id: reportId },
            data: { status },
        });

        // Send email notification if status is RESOLVED or DISMISSED
        if (report.reporter?.email && (status === "RESOLVED" || status === "DISMISSED")) {
            await sendEmail({
                to: report.reporter.email,
                subject: `Report Update: ${status} - JChatAI`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #333;">Report Update</h1>
                        <p>Hello,</p>
                        <p>Your report regarding <strong>${report.reason}</strong> has been marked as <strong>${status}</strong> by our administrative team.</p>
                        <p>Thank you for helping keep JChatAI community safe.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">Report ID: ${report.id}</p>
                    </div>
                `
            });
        }

        revalidatePath("/reports");
        revalidatePath(`/reports/${reportId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update report status:", error);
        return { success: false, error: "Failed to update status" };
    }
}

export async function getReports(page = 1, limit = 20) {
    try {
        const skip = (page - 1) * limit;
        const [reports, total] = await Promise.all([
            db.report.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    reporter: { select: { username: true, email: true } },
                    targetUser: { select: { username: true, email: true } },
                    targetCharacter: { select: { name: true } },
                },
            }),
            db.report.count(),
        ]);

        return { reports, total, totalPages: Math.ceil(total / limit) };
    } catch (error) {
        console.error("Failed to fetch reports:", error);
        return { reports: [], total: 0, totalPages: 0 };
    }
}

export async function getReportById(reportId: string) {
    try {
        const report = await db.report.findUnique({
            where: { id: reportId },
            include: {
                reporter: true,
                targetUser: true,
                targetCharacter: true,
            }
        });
        return report;
    } catch (error) {
        console.error("Failed to fetch report:", error);
        return null;
    }
}
