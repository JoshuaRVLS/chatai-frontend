'use client';

import Header from '@/components/Header';
import DataTable from '@/components/DataTable';

// Mock data
const characters = [
    { id: '1', name: 'Luna', creator: 'admin@jchatai.space', conversations: 12543, status: 'public', createdAt: '2024-01-15' },
    { id: '2', name: 'Atlas', creator: 'user123@email.com', conversations: 9821, status: 'public', createdAt: '2024-01-12' },
    { id: '3', name: 'Nova', creator: 'creator@email.com', conversations: 7654, status: 'private', createdAt: '2024-01-10' },
    { id: '4', name: 'Echo', creator: 'designer@email.com', conversations: 5432, status: 'public', createdAt: '2024-01-08' },
    { id: '5', name: 'Shadow', creator: 'dev@email.com', conversations: 3210, status: 'unlisted', createdAt: '2024-01-05' },
];

export default function CharactersPage() {
    const columns = [
        {
            key: 'name',
            header: 'Character',
            render: (char: typeof characters[0]) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{char.name.charAt(0)}</span>
                    </div>
                    <span className="font-medium">{char.name}</span>
                </div>
            ),
        },
        { key: 'creator', header: 'Creator' },
        {
            key: 'conversations',
            header: 'Conversations',
            render: (char: typeof characters[0]) => char.conversations.toLocaleString(),
        },
        {
            key: 'status',
            header: 'Status',
            render: (char: typeof characters[0]) => (
                <span className={`badge ${char.status === 'public' ? 'badge-success' :
                        char.status === 'private' ? 'badge-warning' : 'badge-primary'
                    }`}>
                    {char.status}
                </span>
            ),
        },
        { key: 'createdAt', header: 'Created' },
    ];

    return (
        <div className="min-h-screen">
            <Header title="Characters" subtitle="Manage AI characters" />

            <div className="p-8 animate-fade-in">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Total Characters</p>
                        <p className="text-2xl font-bold mt-1">1,248</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Public</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--accent)]">892</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Private</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--warning)]">284</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Unlisted</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--primary)]">72</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <select className="input w-auto">
                            <option>All Status</option>
                            <option>Public</option>
                            <option>Private</option>
                            <option>Unlisted</option>
                        </select>
                        <select className="input w-auto">
                            <option>Sort by</option>
                            <option>Most Popular</option>
                            <option>Newest</option>
                            <option>Oldest</option>
                        </select>
                    </div>
                    <button className="btn btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Character
                    </button>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={characters} />
            </div>
        </div>
    );
}
