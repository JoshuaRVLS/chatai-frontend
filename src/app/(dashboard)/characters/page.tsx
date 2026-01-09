'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';

interface Character {
    id: string;
    name: string;
    creator: string;
    conversations: number;
    isNsfw: boolean;
    createdAt: string;
}

interface Stats {
    total: number;
    nsfw: number;
    sfw: number;
}

export default function CharactersPage() {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, nsfw: 0, sfw: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchCharacters = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                search,
                sort,
                filter,
                limit: '10'
            });
            const res = await fetch(`/api/characters?${query}`);
            const data = await res.json();
            if (data.data) {
                setCharacters(data.data);
                setStats(data.stats);
                setTotal(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch characters:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCharacters();
    }, [page, sort, filter]);

    // Handle search with debounce alternative for now (simple trigger on enter or button if we had one, but let's just use effect)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCharacters();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this character? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchCharacters();
            } else {
                alert('Failed to delete character');
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

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
            header: '',
            render: (char: Character) => (
                <button
                    onClick={() => handleDelete(char.id)}
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all group"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )
        }
    ];

    return (
        <div className="min-h-screen">
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
                            <p className={`text-4xl font-black italic tracking-tighter uppercase leading-none text-${s.color}`}>{s.val}</p>
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
                    </div>
                </div>

                {/* Data Table */}
                <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
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
                </div>
            </div>
        </div >
    );
}
