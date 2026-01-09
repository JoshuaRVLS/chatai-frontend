'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import DataTable from '@/components/DataTable';

interface User {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    charCount: number;
    chatCount: number;
}

interface Stats {
    total: number;
    admins: number;
    users: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, admins: 0, users: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [role, setRole] = useState('all');
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
    }, [page, sort, role]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

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
            header: 'User',
            render: (user: User) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden">
                        <span className="text-white font-black text-[10px] uppercase leading-none">{user.name.charAt(0)}</span>
                    </div>
                    <div>
                        <p className="font-black text-xs uppercase tracking-wide text-zinc-300">{user.name}</p>
                        <p className="text-[9px] font-bold text-zinc-600 lowercase">{user.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            header: 'Status',
            render: (user: User) => (
                <span className={`badge ${user.isAdmin ? 'badge-primary' : 'badge-warning'}`}>
                    {user.isAdmin ? 'Admin' : 'Member'}
                </span>
            ),
        },
        {
            key: 'stats',
            header: 'Activity',
            render: (user: User) => (
                <div className="flex gap-4 text-[10px] font-black uppercase tracking-tighter">
                    <span className="text-zinc-500">{user.charCount} chars</span>
                    <span className="text-zinc-500">{user.chatCount} chats</span>
                </div>
            ),
        },

        {
            key: 'actions',
            header: '',
            render: (user: User) => (
                <button
                    onClick={() => handleDelete(user.id)}
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
            <Header title="User Management" subtitle="Manage platform access" />

            <div className="p-16 space-y-24 animate-fade-in">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {[
                        { label: 'Total Users', val: stats.total.toLocaleString(), color: 'white' },
                        { label: 'Administrators', val: stats.admins.toLocaleString(), color: 'emerald-400' },
                        { label: 'Platform Members', val: stats.users.toLocaleString(), color: 'zinc-400' },
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
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 pl-10 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 w-64 transition-all"
                            />
                            <svg className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none focus:border-white/10 transition-all cursor-pointer"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Administrators</option>
                            <option value="user">Members Only</option>
                        </select>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none focus:border-white/10 transition-all cursor-pointer"
                        >
                            <option value="newest">Latest Users</option>
                            <option value="oldest">Oldest Users</option>
                        </select>
                    </div>
                </div>

                {/* Data Table */}
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
        </div >
    );
}
