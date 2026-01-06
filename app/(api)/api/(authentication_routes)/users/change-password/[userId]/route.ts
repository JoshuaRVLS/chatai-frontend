import { db } from '@/app/utils/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/app/utils/rateLimit';
import { headers } from 'next/headers';
import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8, 'Password baru minimal 8 karakter').regex(passwordRegex, 'Password baru harus mengandung huruf besar, huruf kecil, dan angka'),
  confirmNewPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Password baru tidak cocok",
  path: ["confirmNewPassword"],
});

export const PATCH =
  async (req: Request, { params }: { params: Promise<{ userId: string }> }) => {
    try {
      const headerPayload = await headers();
      const ip = headerPayload.get("x-forwarded-for") || "unknown";

      const limitResult = await rateLimit(ip, { limit: 5, windowMs: 600000 }); // 5 attempts per 10 mins
      if (!limitResult.success) {
        return NextResponse.json(
          { success: false, message: "Terlalu banyak percobaan. Silakan coba lagi nanti." },
          { status: 429 }
        );
      }

      const userId = (await params).userId;
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'User tidak ditemukan' }, { status: 404 });
      }

      const body = await req.json();
      const { oldPassword, newPassword } = await changePasswordSchema.parseAsync(body);

      if (!(await bcrypt.compare(oldPassword, user.password))) {
        return NextResponse.json(
          { success: false, message: 'Password lama salah' }, { status: 400 });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      await db.user.update({
        where: { id: userId },
        data: { password: newPasswordHash },
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
      }
      return NextResponse.json({ success: false, message: "Terjadi kesalahan internal" }, { status: 500 });
    }
  };
