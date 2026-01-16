'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import SkeletonLoader, { TableSkeleton } from '@/components/SkeletonLoader';

interface Character {
    id: string;
    name: string;
    creator: string;
    conversations: number;
    isNsfw: boolean;
    createdAt: string;
    // Details
    persona?: string;
    bio?: string;
    scenario?: string;
    introMessage?: string;
    exampleConversations?: string;
    tags?: { id: string; name: string }[];
    lorebooks?: { id: string; name: string }[];
    chubId?: string | null;
    updatedAt?: string;
    author?: {
        username: string;
        email: string;
    };
    _count?: {
        chats: number;
        comments: number;
    };
}

interface Stats {
    total: number;
    nsfw: number;
    sfw: number;
}

export default function CharactersPage() {
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);

    const fetchCharacters = async () => {
        const query = new URLSearchParams({
            page: page.toString(),
            search,
            sort,
            filter,
            limit: '10'
        });
        const res = await fetch(`/api/characters?${query}`);
        return res.json();
    };

    const { data, isLoading, isPlaceholderData } = useQuery({
        queryKey: ['characters', page, search, sort, filter],
        queryFn: fetchCharacters,
        placeholderData: keepPreviousData,
        refetchInterval: 10000,
    });

    const characters = data?.data || [];
    const stats = data?.stats || { total: 0, nsfw: 0, sfw: 0 };
    const total = data?.total || 0;

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this character? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
            if (res.ok) {
                queryClient.invalidateQueries({ queryKey: ['characters'] });
            } else {
                alert('Failed to delete character');
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    // Details Modal
    const [detailsModal, setDetailsModal] = useState<{ open: boolean; character: Character | null; loading: boolean }>({ open: false, character: null, loading: false });

    const handleViewDetails = async (id: string) => {
        setDetailsModal({ open: true, character: null, loading: true });
        try {
            const res = await fetch(`/api/characters/${id}`);
            if (res.ok) {
                const data = await res.json();
                setDetailsModal({ open: true, character: data, loading: false });
            } else {
                alert('Failed to load details');
                setDetailsModal({ open: false, character: null, loading: false });
            }
        } catch (error) {
            console.error("Fetch details error:", error);
            setDetailsModal({ open: false, character: null, loading: false });
        }
    };

    const closeDetailsModal = () => {
        setDetailsModal({ open: false, character: null, loading: false });
    };

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (detailsModal.open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [detailsModal.open]);

    const columns = [
        {
            key: 'name',
            header: 'Character',
            render: (char: Character) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden">
                        <img
                            src={`/api/characters/picture/${char.id}`}
                            alt={char.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${char.name}&background=09090b&color=fff&bold=true`;
                            }}
                        />
                    </div>
                    <span className="font-black text-xs uppercase tracking-wide text-zinc-300">{char.name}</span>
                </div>
            ),
        },
        { key: 'creator', header: 'Creator' },
        {
            key: 'conversations',
            header: 'Conversations',
            render: (char: Character) => (
                <span className="font-black tabular-nums">{char.conversations.toLocaleString()}</span>
            ),
        },
        {
            key: 'isNsfw',
            header: 'Type',
            render: (char: Character) => (
                <span className={`badge ${char.isNsfw ? 'badge-danger' : 'badge-success'}`}>
                    {char.isNsfw ? 'NSFW' : 'SFW'}
                </span>
            ),
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (char: Character) => (
                <span className="text-[10px] uppercase font-bold text-zinc-500">{char.createdAt}</span>
            ),
        },
        {
            key: 'actions',
            header: 'Tools',
            render: (char: Character) => (
                <div className="flex items-center gap-2 justify-end pr-4">
                    <button
                        onClick={() => handleViewDetails(char.id)}
                        className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white transition-all shadow-sm active:scale-90"
                        title="View Details"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    <a
                        href={`https://jchatai.space/chat/${char.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all shadow-sm"
                        title="Open on Site"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                    <button
                        onClick={() => handleDelete(char.id)}
                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                        title="Purge Character"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col">
            <Header title="Characters" subtitle="Manage AI characters" />

            <div className="space-y-16 animate-fade-in mt-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        { label: 'Total Characters', val: stats.total.toLocaleString(), color: 'white' },
                        { label: 'NSFW Content', val: stats.nsfw.toLocaleString(), color: 'red-400' },
                        { label: 'SFW Content', val: stats.sfw.toLocaleString(), color: 'emerald-400' },
                    ].map((s, i) => (
                        <div key={i} className="card-premium p-6 flex flex-col justify-between h-32">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{s.label}</p>
                            {isLoading && !data ? (
                                <SkeletonLoader className="h-10 w-24" />
                            ) : (
                                <p className={`text-4xl font-black italic tracking-tighter uppercase leading-none text-${s.color}`}>{s.val}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search characters..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 pl-10 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 w-64 transition-all"
                            />
                            <svg className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none focus:border-white/10 transition-all cursor-pointer"
                        >
                            <option value="all">All Content</option>
                            <option value="nsfw">NSFW Only</option>
                            <option value="sfw">SFW Only</option>
                        </select>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none focus:border-white/10 transition-all cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="popular">Most Popular</option>
                        </select>
                        {/* Refetching indicator */}
                        {data && (
                            <button
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['characters'] })}
                                disabled={isLoading}
                                className="bg-white/5 border border-white/5 rounded-2xl p-2 text-zinc-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-inner"
                                title="Refresh Data"
                            >
                                <svg
                                    className={`w-5 h-5 ${isLoading && !isPlaceholderData ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mb-4">
                    <button
                        onClick={async () => {
                            if (confirm('⚠️ DANGER: Are you sure you want to delete ALL characters? This will also delete all chats, messages, and character images. This action cannot be undone.')) {
                                try {
                                    const res = await fetch('/api/characters/clear', { method: 'POST' });
                                    if (res.ok) {
                                        alert('All characters cleared successfully.');
                                        queryClient.invalidateQueries({ queryKey: ['characters'] });
                                    } else {
                                        const err = await res.json();
                                        alert('Failed to clear characters: ' + (err.error || 'Unknown error'));
                                    }
                                } catch (e) {
                                    console.error(e);
                                    alert('An error occurred.');
                                }
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all font-bold text-xs uppercase tracking-wide"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete All Characters
                    </button>
                </div>

                {/* Data Table */}
                <div className='transition-opacity'>
                    {isLoading && !data ? (
                        <TableSkeleton />
                    ) : (
                        <DataTable
                            columns={columns as any}
                            data={characters}
                            pagination={{
                                page,
                                total,
                                limit: 10,
                                onPageChange: setPage
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Details Modal */}
            {detailsModal.open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4"
                    onClick={closeDetailsModal}
                >
                    <div
                        className="bg-zinc-900 rounded-3xl border border-white/10 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeDetailsModal}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {detailsModal.loading ? (
                            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Retrieving Data...</p>
                            </div>
                        ) : detailsModal.character ? (
                            <div className="space-y-8">
                                <div className="flex items-start gap-6">
                                    <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/5 overflow-hidden shrink-0">
                                        <img
                                            src={`/api/characters/picture/${detailsModal.character.id}`}
                                            alt={detailsModal.character.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${detailsModal.character?.name}&background=09090b&color=fff&bold=true`;
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">{detailsModal.character.name}</h2>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className={`badge ${detailsModal.character.isNsfw ? 'badge-danger' : 'badge-success'}`}>
                                                {detailsModal.character.isNsfw ? 'NSFW' : 'SFW'}
                                            </span>
                                            {detailsModal.character.tags?.map(tag => (
                                                <span key={tag.id} className="badge bg-white/5 border-white/10 text-zinc-400">
                                                    #{tag.name}
                                                </span>
                                            ))}
                                        </div>
                                        {detailsModal.character.chubId && (
                                            <div className="mt-4">
                                                <a
                                                    href={`https://chub.ai/characters/${detailsModal.character.chubId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-xs font-bold text-sky-500 hover:text-sky-400 transition-colors bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/10 hover:border-sky-500/20"
                                                >
                                                    View on Chub.ai
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 rounded-2xl p-6 border border-white/5">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Author</p>
                                        <p className="text-sm font-bold text-white truncate">{detailsModal.character.author?.username || detailsModal.character.creator}</p>
                                        <p className="text-[10px] text-zinc-500 truncate">{detailsModal.character.author?.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Created</p>
                                        <p className="text-sm font-bold text-zinc-300">{new Date(detailsModal.character.createdAt).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-zinc-500">{new Date(detailsModal.character.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Statistics</p>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-zinc-400">
                                                <span className="text-white">{detailsModal.character._count?.chats || detailsModal.character.conversations || 0}</span> Chats
                                            </span>
                                            <span className="text-xs font-bold text-zinc-400">
                                                <span className="text-white">{detailsModal.character._count?.comments || 0}</span> Comments
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">System ID</p>
                                        <p className="text-[10px] font-mono text-zinc-500 truncate bg-black/20 p-1.5 rounded border border-white/5 select-all">
                                            {detailsModal.character.id}
                                        </p>
                                    </div>
                                </div>

                                {/* Lorebooks */}
                                {detailsModal.character.lorebooks && detailsModal.character.lorebooks.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Linked Lorebooks</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {detailsModal.character.lorebooks.map(lb => (
                                                <div key={lb.id} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/10 rounded-lg px-3 py-2 text-emerald-400 text-xs font-bold">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                    {lb.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-500">Persona</h3>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
                                            <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-mono">{detailsModal.character.persona || 'No persona defined.'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-500">Scenario</h3>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
                                            <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-mono">{detailsModal.character.scenario || 'No scenario defined.'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-500">First Message</h3>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 max-h-40 overflow-y-auto custom-scrollbar">
                                            <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-mono">{detailsModal.character.introMessage || 'No intro message.'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-500">Bio / Description</h3>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
                                            <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-mono">{detailsModal.character.bio || 'No bio.'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-sky-500">Example Dialogue</h3>
                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
                                            <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-mono">{detailsModal.character.exampleConversations || 'No examples.'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-white/30 font-bold uppercase tracking-widest">Failed to load character data</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
