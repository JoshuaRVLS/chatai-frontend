import { db } from "@/app/utils/prisma";
import { z } from "zod";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const userSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const POST = async (req: Request) => {
  try {
    const { username, password } = await userSchema.parseAsync(
      await req.json()
    );

    console.log(username, password);
    const user = await db.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
      include: {
        profileImage: true,
      },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User belum terdaftar" },
        { status: 200 }
      );
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { success: false, message: "Password salah" },
        { status: 200 }
      );
    }

    if (!user.verified) {
      return NextResponse.json(
        {
          success: false,
          message: "Tolong aktivasi akun terlebih dahulu",
          userId: user.id,
        },
        {
          status: 200,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Login berhasil",
        userId: user.id,
        username: user.username,
        hasPicture: !!user.profileImage,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
  }
};
