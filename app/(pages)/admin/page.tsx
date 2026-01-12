
import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/auth';
import { redirect } from 'next/navigation';
import { db } from '@/app/utils/prisma';
import BannerManager from '../components/Admin/BannerManager';

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    // Server-side protection
    if (!session?.user?.email) redirect('/login');

    const user = await db.user.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true }
    });

    if (!user?.isAdmin) redirect('/');

    return (
        <div className="min-h-screen pt-32 px-6 pb-20">
            <div className="max-w-5xl mx-auto space-y-12">
                <header>
                    <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg">
                        Admin Command
                    </h1>
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.2em] mt-2">
                        System Control & Configuration
                    </p>
                </header>

                <div className="grid gap-8">
                    <BannerManager />
                </div>
            </div>
        </div>
    );
}
