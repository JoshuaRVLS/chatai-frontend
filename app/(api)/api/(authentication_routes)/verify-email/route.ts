import { db } from "@/app/utils/prisma";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json(
      { success: false, message: "Email and code are required" },
      { status: 400 }
    );
  }

  const user = await db.user.findFirst({
    where: {
      email: email,
      verificationToken: code,
      verificationTokenExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Invalid or expired verification code" },
      { status: 400 }
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      verified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  return NextResponse.json(
    { success: true, message: "Email verified successfully" },
    { status: 200 }
  );
};
