"use client";

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { FiUser, FiCalendar, FiBox, FiMessageSquare, FiChevronLeft, FiBook } from 'react-icons/fi';
import CharacterCard from '../../components/CharacterCard/CharacterCard';
import LorebookCard from '../../components/Lorebooks/LorebookCard';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { fadeUpVariants, scaleInVariants } from '../../components/Animations/variants';
import { bytesToBase64 } from '@/app/utils/image';
import { useState } from 'react';

const UserProfilePage = () => {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;
    const [activeTab, setActiveTab] = useState<'characters' | 'lorebooks'>('characters');

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
                                    src={bytesToBase64(user.profileImage)}
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
                        <div className="absolute inset-[-4px] rounded-full bg-linear-to-tr from-purple-500/20 to-blue-500/20 blur-md z-0 group-hover:from-purple-500/40 group-hover:to-blue-500/40 transition-colors duration-500" />
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
                                    <FiBox /> {user.charCreated.length} Characters
                                </span>
                                <span className="flex items-center gap-2">
                                    <FiBook /> {user.lorebooks?.length || 0} Lorebooks
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

                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-white/5">
                    <button
                        onClick={() => setActiveTab('characters')}
                        className={`pb-4 text-sm font-black uppercase tracking-wider transition-colors relative ${activeTab === 'characters' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                    >
                        Characters
                        {activeTab === 'characters' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('lorebooks')}
                        className={`pb-4 text-sm font-black uppercase tracking-wider transition-colors relative ${activeTab === 'lorebooks' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                    >
                        Lorebooks
                        {activeTab === 'lorebooks' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
                        )}
                    </button>
                </div>

                {/* Content Grid */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'characters' ? (
                            <motion.div
                                key="char-grid"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center gap-3 mb-6">
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
                                                    rating={char.rating}
                                                    ratingCount={char.ratingCount}
                                                    chatCount={char.chatCount}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState icon={<FiBox size={24} />} title="No Characters" description="This user hasn't published any characters." />
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="lore-grid"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-1.5 h-8 bg-purple-400 rounded-full" />
                                    <h2 className="text-2xl font-black text-white uppercase tracking-wide">World Knowledge</h2>
                                </div>

                                {user.lorebooks && user.lorebooks.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {user.lorebooks.map((lorebook: any, index: number) => (
                                            <motion.div
                                                key={lorebook.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <LorebookCard
                                                    lorebook={lorebook}
                                                    onUpdate={() => { }}
                                                    currentUserId={session?.user?.id}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState icon={<FiBook size={24} />} title="No Lorebooks" description="This user hasn't created any lorebooks." />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const EmptyState = ({ icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="w-full py-20 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
            {icon}
        </div>
        <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">{title}</h3>
            <p className="text-white/40 text-sm">{description}</p>
        </div>
    </div>
);

export default UserProfilePage;
