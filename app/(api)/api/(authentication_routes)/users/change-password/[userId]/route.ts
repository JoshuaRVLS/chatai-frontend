import {db} from '@/app/utils/prisma';
import bcrypt from 'bcryptjs';
import {NextResponse} from 'next/server';

export const PATCH =
    async (req: Request, {params}: {params: Promise<{userId: string}>}) => {
  const userId = (await params).userId;
  const user = await db.user.findUnique({where: {id: userId}});
  if (!user) {
    return NextResponse.json(
        {success: false, message: 'User not found'}, {status: 404});
  }

  const {oldPassword, confirmNewPassword, newPassword} = await req.json();

  if (!(await bcrypt.compare(oldPassword, user.password))) {
    return NextResponse.json(
        {success: false, message: 'Old password is incorrect'}, {status: 400});
  }

  if (newPassword !== confirmNewPassword) {
    return NextResponse.json(
        {success: false, message: 'Passwords do not match'}, {status: 400});
  }

  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(newPassword, salt);

  await db.user.update({
    where: {id: userId},
    data: {password: newPasswordHash},
  });

  return NextResponse.json({success: true}, {status: 200});
};
