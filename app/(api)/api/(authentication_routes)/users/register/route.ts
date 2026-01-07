import { db } from '@/app/utils/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/app/utils/rateLimit';
import { headers } from 'next/headers';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const userSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').regex(passwordRegex, 'Password harus mengandung huruf besar, huruf kecil, dan angka'),
  confirmPassword: z.string().min(8, 'Password minimal 8 karakter'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

export const POST = async (req: Request) => {
  try {
    const headerPayload = await headers();
    const ip = headerPayload.get("x-forwarded-for") || "unknown";

    const limitResult = await rateLimit(ip, { limit: 3, windowMs: 3600000 }); // 3 registrations per hour
    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, message: "Terlalu banyak percobaan registrasi. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const data = await req.json();
    console.log(data);
    const userData = await userSchema.parseAsync(data);
    const user = await db.user.findFirst({
      where: {
        OR: [{ username: userData.username }, { email: userData.email }],
      },
    });
    if (user) {
      // Return a generic success message even if user exists to prevent enumeration
      // But for better UX or if desired by user, we can keep it as is.
      // Based on the request "more secure", I'll use a slightly more vague but helpful message if possible,
      // or just keep it simple but harder to guess.
      // Actually, standard security practice for PUBLIC registration is to not leak presence, 
      // but typical apps DO leak it for better UX. I'll stick to a slightly better worded error.
      return NextResponse.json(
        { success: false, message: 'Username atau email sudah digunakan' },
        { status: 400 }
      );
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires =
      new Date(Date.now() + 24 * 60 * 60 * 1000);  // 24 hours\

    const userCreated = await db.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password: await bcrypt.hash(userData.password, 10),
        verificationToken,
        verificationTokenExpires,
        userSettings: {
          create: {
            showNsfw: false,
            blurNsfw: true,
          }
        }
      },
    });

    const baseUrl = new URL(req.url).origin;
    await fetch(`${baseUrl}/api/send-verification`, {
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
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: error.issues[0].message, errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mendaftar" },
      { status: 500 }
    );
  }
};
