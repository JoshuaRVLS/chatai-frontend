import { generateProfileImage } from '@/app/utils/image';
import { db } from '@/app/utils/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword:
    z.string().min(8, 'Password must be at least 8 characters long'),
});

export const POST = async (req: Request) => {
  try {
    const data = await req.json();
    console.log(data);
    const userData = await userSchema.parseAsync(data);
    const user = await db.user.findFirst({
      where: {
        OR: [{ username: userData.username }, { email: userData.email }],
      },
    });
    if (user) {
      return NextResponse.json(
        { success: false, message: 'User sudah terdaftar' }, { status: 400 });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires =
      new Date(Date.now() + 24 * 60 * 60 * 1000);  // 24 hours\

    const profileImageBuffer =
      generateProfileImage(userData.username.substring(0, 2));

    const userCreated = await db.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        profileImage: {
          create: {
            data: Buffer.from(profileImageBuffer),
            mimetype: 'image/png',
          },
        },
        password: await bcrypt.hash(userData.password, 10),
        verificationToken,
        verificationTokenExpires,
      },
    });

    await fetch(`${process.env.NEXTAUTH_URL}/api/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        verificationToken,
      }),
    });

    return NextResponse.json(
      {
        success: true,
        message:
          'User berhasil terdaftar...Silahkan check email untuk aktivasi akun.',
        user: userCreated,
      },
      { status: 200 });
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
  }
};
