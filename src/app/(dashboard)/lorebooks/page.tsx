'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';

interface Lorebook {
    id: string;
    name: string;
    entries: number;
    characters: number;
    creator: string;
    createdAt: string;
}

interface Stats {
    total: number;
    entries: number;
    public: number;
    private: number;
}

export default function LorebooksPage() {
    const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');

    const fetchLorebooks = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search,
                sort
            });
            const res = await fetch(`/api/lorebooks?${query}`);
            const data = await res.json();
            if (data.data) {
                setLorebooks(data.data);
                setStats(data.stats);
                setTotal(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch lorebooks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLorebooks();
    }, [page, sort]);

    // Handle search with debounce in a real app, but for now just a trigger
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page !== 1) setPage(1);
            else fetchLorebooks();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lorebook? All entries will be permanently removed!')) return;
        try {
            const res = await fetch(`/api/lorebooks/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchLorebooks();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete lorebook');
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'Lorebook',
            render: (book: Lorebook) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <span className="font-black text-xs uppercase tracking-wide text-zinc-300">{book.name}</span>
                </div>
            ),
        },
        {
            key: 'entries', header: 'Entries', render: (book: Lorebook) => (
                <div className="flex items-center gap-2">
                    <span className="text-white font-black">{book.entries}</span>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase">items</span>
                </div>
            )
        },
        {
            key: 'characters', header: 'Chars', render: (book: Lorebook) => (
                <div className="flex items-center gap-2">
                    <span className="text-white font-black">{book.characters}</span>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase">links</span>
                </div>
            )
        },
        {
            key: 'creator', header: 'Creator', render: (book: Lorebook) => (
                <span className="text-zinc-400 font-bold lowercase">{book.creator}</span>
            )
        },
        {
            key: 'createdAt', header: 'Created', render: (book: Lorebook) => (
                <span className="text-[10px] font-black uppercase text-zinc-600">{new Date(book.createdAt).toLocaleDateString()}</span>
            )
        },
        {
            key: 'actions',
            header: '',
            render: (book: Lorebook) => (
                <button
                    onClick={() => handleDelete(book.id)}
                    className="p-2 rounded-lg bg-white/5 border border-white/5 text-zinc-600 hover:text-red-500 hover:border-red-500/20 transition-all"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            )
        }
    ];

    return (
        <div className="min-h-screen">
            <Header title="Lorebooks" subtitle="Global Knowledge Management" />

            <div className="p-20 space-y-24 animate-fade-in">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {[
                        { label: 'Total Books', val: stats?.total || 0, color: 'white' },
                        { label: 'Global Entries', val: stats?.entries || 0, color: 'amber-400' },
                        { label: 'Public Access', val: stats?.public || 0, color: 'emerald-400' },
                        { label: 'Private Repos', val: stats?.private || 0, color: 'zinc-500' },
                    ].map((s, i) => (
                        <div key={i} className="card-premium p-6 flex flex-col justify-between h-32">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{s.label}</p>
                            <p className={`text-4xl font-black italic tracking-tighter uppercase leading-none text-${s.color}`}>{s.val.toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Search lorebooks..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 pl-10 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 w-64 transition-all"
                            />
                            <svg className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none focus:border-white/10 transition-all cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="entries">Most Entries</option>
                            <option value="characters">Most Character Links</option>
                        </select>
                    </div>
                </div>

                {/* Data Table */}
                <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
                    <DataTable
                        columns={columns as any}
                        data={lorebooks}
                        pagination={{
                            page,
                            total,
                            limit: 10,
                            onPageChange: setPage
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
