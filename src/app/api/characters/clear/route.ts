import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const secret = searchParams.get('key');

        // Basic protection or check session if available. 
        // Admin panel usually relies on middleware, but good to check admin here too if we had auth helper.
        // Assuming Middleware handles admin access for /api routes usually, but let's be safe.
        // Since this is destructive, we might want to check the user session manually if possible 
        // or assume the middleware protecting /admin routes does its job.

        // NOTE: For now relying on Middleware for Auth.

        // Transactional delete
        await prisma.$transaction(async (tx) => {
            // 1. Delete all Messages
            await tx.message.deleteMany({});

            // 2. Delete all Chats
            await tx.chat.deleteMany({});

            // 3. Delete all Character Images
            await tx.characterImage.deleteMany({});

            // 4. Delete all Comments
            await tx.comment.deleteMany({});

            // 5. Delete all Characters
            await tx.character.deleteMany({});
        }, {
            maxWait: 60000, // default: 2000
            timeout: 60000, // default: 5000
        });

        return NextResponse.json({ message: "All characters and related data cleared successfully" });
    } catch (error: any) {
        console.error("Failed to clear characters:", error);
        return NextResponse.json({ error: "Failed to clear characters", details: error.message }, { status: 500 });
    }
}
