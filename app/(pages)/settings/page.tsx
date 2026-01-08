import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import React from 'react';
import Settings from '../components/Settings/Settings';
import { authOptions } from '@/app/utils/auth';

const page = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <Settings />
  );
};

export default page;