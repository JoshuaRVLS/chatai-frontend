'use client';

import Header from '@/components/Header';
import DataTable from '@/components/DataTable';

// Mock data
const conversations = [
    { id: '1', user: 'john@email.com', character: 'Luna', messages: 156, duration: '45 min', startedAt: '2024-01-15 14:30' },
    { id: '2', user: 'jane@email.com', character: 'Atlas', messages: 89, duration: '22 min', startedAt: '2024-01-15 13:15' },
    { id: '3', user: 'bob@email.com', character: 'Nova', messages: 234, duration: '1h 12min', startedAt: '2024-01-15 12:00' },
    { id: '4', user: 'alice@email.com', character: 'Echo', messages: 67, duration: '18 min', startedAt: '2024-01-15 10:45' },
    { id: '5', user: 'charlie@email.com', character: 'Luna', messages: 312, duration: '2h 5min', startedAt: '2024-01-15 09:30' },
];

export default function ConversationsPage() {
    const columns = [
        { key: 'id', header: 'ID', render: (conv: typeof conversations[0]) => `#${conv.id}` },
        { key: 'user', header: 'User' },
        {
            key: 'character',
            header: 'Character',
            render: (conv: typeof conversations[0]) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
                        <span className="text-white font-bold text-[10px]">{conv.character.charAt(0)}</span>
                    </div>
                    <span>{conv.character}</span>
                </div>
            ),
        },
        { key: 'messages', header: 'Messages' },
        { key: 'duration', header: 'Duration' },
        { key: 'startedAt', header: 'Started' },
    ];

    return (
        <div className="min-h-screen">
            <Header title="Conversations" subtitle="View and manage conversations" />

            <div className="p-8 animate-fade-in">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Today&apos;s Conversations</p>
                        <p className="text-2xl font-bold mt-1">34,521</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Active Now</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--accent)]">1,234</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Avg. Messages</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--primary)]">47</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Avg. Duration</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--warning)]">23 min</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <input type="date" className="input w-auto" />
                        <select className="input w-auto">
                            <option>All Characters</option>
                            <option>Luna</option>
                            <option>Atlas</option>
                            <option>Nova</option>
                        </select>
                    </div>
                    <button className="btn btn-secondary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={conversations} />
            </div>
        </div>
    );
}
