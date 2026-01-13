"use client";

import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { FiUser, FiCalendar, FiBox, FiMessageSquare, FiChevronLeft } from 'react-icons/fi';
import CharacterCard from '../../components/CharacterCard/CharacterCard';
import { motion } from 'motion/react';
import Link from 'next/link';
import { fadeUpVariants, scaleInVariants } from '../../components/Animations/variants';

const UserProfilePage = () => {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const { data: user, isPending, error } = useQuery({
        queryKey: ['userProfile', username],
        queryFn: () => fetch(`/api/users/profile/${username}`).then(res => res.json().then(data => data.data)),
        enabled: !!username
    });

    if (isPending) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/5 border-t-white rounded-full animate-spin" />
        </div>
    );

    if (error || !user) return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">User Not Found</h2>
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold">Return Home</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 pt-24 pb-20 px-6 sm:px-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-500/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[150px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10 space-y-12">
                {/* Header / Back */}
                <motion.div variants={fadeUpVariants} initial="hidden" animate="visible">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-8 group"
                    >
                        <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Home
                    </Link>
                </motion.div>

                {/* Profile Header */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={scaleInVariants}
                    className="flex flex-col md:flex-row items-start md:items-end gap-8 border-b border-white/5 pb-12"
                >
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-zinc-900 bg-zinc-800 shadow-2xl relative z-10">
                            {user.profileImage ? (
                                <Image
                                    src={`/api/users/picture/${user.id}`}
                                    alt={user.username}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white/20">
                                    <FiUser size={48} />
                                </div>
                            )}
                        </div>
                        {/* Decorative Ring */}
                        <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 blur-md -z-0 group-hover:from-purple-500/40 group-hover:to-blue-500/40 transition-colors duration-500" />
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-2">
                                {user.username}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-white/40 uppercase tracking-wider">
                                <span className="flex items-center gap-2">
                                    <FiCalendar /> Joined {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-2">
                                    <FiBox /> {user._count.charCreated} Characters
                                </span>
                            </div>
                        </div>

                        {user.bio && (
                            <p className="max-w-2xl text-white/80 leading-relaxed font-medium">
                                {user.bio}
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* Characters Grid */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-white rounded-full" />
                        <h2 className="text-2xl font-black text-white uppercase tracking-wide">Masterpieces</h2>
                    </div>

                    {user.charCreated.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {user.charCreated.map((char: any, index: number) => (
                                <motion.div
                                    key={char.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <CharacterCard
                                        authorName={user.username}
                                        characterName={char.name}
                                        image={char.photo ? `/api/image/${char.id}` : null}
                                        characterBio={char.bio}
                                        tags={char.tags}
                                        characterId={char.id}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full py-20 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                                <FiBox size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-wider">No Creations Yet</h3>
                                <p className="text-white/40 text-sm">This user hasn't published any characters.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
