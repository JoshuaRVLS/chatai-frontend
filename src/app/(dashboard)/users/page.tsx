'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';

interface User {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    isWhitelisted: boolean;
    verified: boolean;
    charCount: number;
    chatCount: number;
    commentCount: number;
    lorebookCount: number;
    personaCount: number;
}

interface Stats {
    total: number;
    admins: number;
    users: number;
    verified: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, users: 0, verified: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [role, setRole] = useState('all');
    const [verified, setVerified] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                search,
                sort,
                role,
                verified,
                limit: '10'
            });
            const res = await fetch(`/api/users?${query}`);
            const data = await res.json();
            if (data.data) {
                setUsers(data.data);
                setStats(data.stats);
                setTotal(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, sort, role, verified]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const handleToggleAdmin = async (id: string, current: boolean) => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAdmin: !current })
            });
            if (res.ok) fetchUsers();
            else {
                const data = await res.json();
                alert(data.error || 'Update failed');
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    const handleToggleVerified = async (id: string, current: boolean) => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verified: !current })
            });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    const handleToggleWhitelisted = async (id: string, current: boolean) => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isWhitelisted: !current })
            });
            if (res.ok) fetchUsers();
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This will also delete all their characters, chats, and data!')) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'User & Security',
            render: (user: User) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                        <span className="text-white font-black text-xs uppercase leading-none">{user.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-black text-xs uppercase tracking-wide text-zinc-300 truncate">{user.name}</p>
                            {user.verified && (
                                <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <p className="text-[9px] font-bold text-zinc-600 lowercase truncate">{user.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            header: 'Status',
            render: (user: User) => (
                <div className="flex flex-col gap-1.5">
                    <button
                        onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                        className={`badge cursor-pointer hover:opacity-80 transition-opacity ${user.isAdmin ? 'badge-primary' : 'badge-warning'}`}
                    >
                        {user.isAdmin ? 'Admin' : 'Member'}
                    </button>
                    <button
                        onClick={() => handleToggleVerified(user.id, user.verified)}
                        className={`badge cursor-pointer hover:opacity-80 transition-opacity ${user.verified ? 'badge-success' : 'badge-danger'}`}
                    >
                        {user.verified ? 'Verified' : 'Unverified'}
                    </button>
                    <button
                        onClick={() => handleToggleWhitelisted(user.id, user.isWhitelisted)}
                        className={`badge cursor-pointer hover:opacity-80 transition-opacity ${user.isWhitelisted ? 'bg-amber-500/20 border-amber-500/20 text-amber-500' : 'bg-white/5 border-white/10 text-zinc-500'}`}
                    >
                        {user.isWhitelisted ? 'Whitelisted' : 'Not Listed'}
                    </button>
                </div>
            ),
        },
        {
            key: 'stats',
            header: 'Activity Profile',
            render: (user: User) => (
                <div className="flex flex-wrap gap-x-4 gap-y-1 max-w-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-300">{user.charCount}</span>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Chars</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-300">{user.chatCount}</span>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Chats</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-300">{user.commentCount}</span>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Comm</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-300">{user.lorebookCount}</span>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Lore</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Tools',
            render: (user: User) => (
                <div className="flex justify-end pr-4">
                    <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all group shadow-sm active:scale-90"
                        title="Delete User"
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
            <Header title="User Intelligence" subtitle="Deep oversight of platform participants" />

            <div className="space-y-16 animate-fade-in mt-8">
                {/* Advanced Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {[
                        { label: 'Total Entities', val: stats.total.toLocaleString(), color: 'white' },
                        { label: 'Authorized Admins', val: stats.admins.toLocaleString(), color: 'emerald-400' },
                        { label: 'Verified Accounts', val: stats.verified.toLocaleString(), color: 'sky-400' },
                        { label: 'Standard Tier', val: (stats.total - stats.admins).toLocaleString(), color: 'zinc-400' },
                    ].map((s, i) => (
                        <div key={i} className="card-premium p-8 flex flex-col justify-between h-40">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{s.label}</p>
                            <p className={`text-5xl font-black italic tracking-tighter uppercase leading-none text-${s.color}`}>{s.val}</p>
                        </div>
                    ))}
                </div>

                {/* Intelligent Filtering */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Locate user..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white/5 border border-white/5 rounded-2xl px-5 py-3 pl-12 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 w-72 transition-all shadow-inner"
                            />
                            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl p-1 shadow-inner">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="bg-transparent px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none transition-all cursor-pointer hover:text-white"
                            >
                                <option value="all">Role: All</option>
                                <option value="admin">Role: Admins</option>
                                <option value="user">Role: Members</option>
                            </select>
                            <div className="w-px h-4 bg-white/5" />
                            <select
                                value={verified}
                                onChange={(e) => setVerified(e.target.value)}
                                className="bg-transparent px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none transition-all cursor-pointer hover:text-white"
                            >
                                <option value="all">Verification: All</option>
                                <option value="verified">Verified Only</option>
                                <option value="unverified">Unverified Only</option>
                            </select>
                            <div className="w-px h-4 bg-white/5" />
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="bg-transparent px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none transition-all cursor-pointer hover:text-white"
                            >
                                <option value="newest">Sort: Discovery</option>
                                <option value="oldest">Sort: Legacy</option>
                                <option value="most_characters">Sort: Creators</option>
                                <option value="most_chats">Sort: Activity</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Intelligence Feed */}
                <div className={loading ? 'opacity-50 pointer-events-none transition-opacity' : 'transition-opacity'}>
                    <DataTable
                        columns={columns as any}
                        data={users}
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
