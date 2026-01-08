import { db } from '@/app/utils/prisma';
import { NextResponse } from 'next/server';

export const PATCH = async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { feedback } = await req.json();
        const { id: messageId } = await params;

        if (!['NONE', 'LIKE', 'DISLIKE'].includes(feedback)) {
            return NextResponse.json({ success: false, error: 'Invalid feedback value' }, { status: 400 });
        }

        const updatedMessage = await db.message.update({
            where: { id: messageId },
            data: { feedback },
        });

        return NextResponse.json({ success: true, data: updatedMessage });
    } catch (error) {
        console.error('[MESSAGE_FEEDBACK_PATCH]', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
};
