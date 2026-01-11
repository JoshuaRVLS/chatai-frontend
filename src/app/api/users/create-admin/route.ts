import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.isAdmin) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { username, email, password } = await req.json();

        if (!username || !email || !password) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        const existingUser = await db.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email },
                ],
            },
        });

        if (existingUser) {
            return new NextResponse('User with this username or email already exists', { status: 409 });
        }

        const hashedPassword = await hash(password, 12);

        const user = await db.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                isAdmin: true,
                isWhitelisted: true,
                verified: true,
            },
        });

        return NextResponse.json({
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin,
        });
    } catch (error) {
        console.error('[CREATE_ADMIN_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
