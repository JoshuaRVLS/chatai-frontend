'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';
import { useQuery, keepPreviousData, useQueryClient } from '@tanstack/react-query';
import SkeletonLoader, { TableSkeleton } from '@/components/SkeletonLoader';

interface Conversation {
    id: string;
    user: string;
    character: string;
    characterId: string;
    messages: number;
    startedAt: string;
}

interface Stats {
    today: number;
    total: number;
    avgMessages: number;
    activeNow: number;
}

export default function ConversationsPage() {
    const queryClient = useQueryClient();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [characters, setCharacters] = useState<{ id: string, name: string }[]>([]);
    const [page, setPage] = useState(1);
    const [charId, setCharId] = useState('all');
    const [date, setDate] = useState('');

    const fetchConversations = async () => {
        const query = new URLSearchParams({
            page: page.toString(),
            limit: '10',
            characterId: charId,
            date: date
        });
        const res = await fetch(`/api/conversations?${query}`);
        return res.json();
    };

    const fetchCharacters = async () => {
        try {
            const res = await fetch('/api/characters/all');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCharacters(data);
            }
        } catch (error) {
            console.error("Failed to fetch characters:", error);
        }
    };

    useEffect(() => {
        fetchCharacters();
    }, []);

    const { data, isLoading, isPlaceholderData } = useQuery({
        queryKey: ['conversations', page, charId, date],
        queryFn: fetchConversations,
        placeholderData: keepPreviousData,
        refetchInterval: 10000,
    });

    const conversationsList = data?.data || [];
    const stats = data?.stats || { today: 0, total: 0, avgMessages: 0, activeNow: 0 };
    const total = data?.total || 0;

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this conversation and all its messages?')) return;
        try {
            const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchConversations();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete conversation');
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const columns = [
        {
            key: 'id', header: 'ID', render: (conv: Conversation) => (
                <span className="text-[10px] font-mono text-zinc-500">#{conv.id.slice(-6).toUpperCase()}</span>
            )
        },
        {
            key: 'user', header: 'User', render: (conv: Conversation) => (
                <span className="text-zinc-300 font-bold lowercase">{conv.user}</span>
            )
        },
        {
            key: 'character',
            header: 'Character',
            render: (conv: Conversation) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden">
                        <img
                            src={`/api/characters/picture/${conv.characterId}`}
                            alt={conv.character}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${conv.character}&background=09090b&color=fff&bold=true`;
                            }}
                        />
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-wide text-zinc-400">{conv.character}</span>
                </div>
            ),
        },
        {
            key: 'messages', header: 'Messages', render: (conv: Conversation) => (
                <div className="flex items-center gap-2">
                    <span className="text-white font-black">{conv.messages}</span>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase">msgs</span>
                </div>
            )
        },
        {
            key: 'startedAt', header: 'Started', render: (conv: Conversation) => (
                <span className="text-[10px] font-black uppercase text-zinc-500">{new Date(conv.startedAt).toLocaleString()}</span>
            )
        },
        {
            key: 'actions',
            header: 'Tools',
            render: (conv: Conversation) => (
                <div className="flex justify-end pr-4">
                    <button
                        onClick={() => handleDelete(conv.id)}
                        className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                        title="Delete Session"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col">
            <Header title="Conversations" subtitle="Real-time session monitoring" />

            <div className="space-y-16 animate-fade-in mt-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {[
                        { label: 'Today', val: stats?.today || 0, color: 'white' },
                        { label: 'Total', val: stats?.total || 0, color: 'zinc-400' },
                        { label: 'Avg Messages', val: stats?.avgMessages || 0, color: 'emerald-400' },
                        { label: 'Active Now', val: stats?.activeNow || 0, color: 'sky-400' },
                    ].map((s, i) => (
                        <div key={i} className="card-premium p-6 flex flex-col justify-between h-32">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{s.label}</p>
                            {isLoading && !data ? (
                                <SkeletonLoader className="h-10 w-24" />
                            ) : (
                                <p className={`text-3xl font-black italic tracking-tighter uppercase leading-none text-${s.color}`}>{s.val.toLocaleString()}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <select
                            value={charId}
                            onChange={(e) => setCharId(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none focus:border-white/10 transition-all cursor-pointer"
                        >
                            <option value="all">All Characters</option>
                            {characters.map(char => (
                                <option key={char.id} value={char.id}>{char.name}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none focus:border-white/10 transition-all cursor-pointer"
                        />
                        {/* Refetching indicator */}
                        {data && (
                            <button
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['conversations'] })}
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

                {/* Data Table */}
                <div className='transition-opacity'>
                    {isLoading && !data ? (
                        <TableSkeleton />
                    ) : (
                        <DataTable
                            columns={columns as any}
                            data={conversationsList}
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
        </div>
    );
}
