'use client';

import Header from '@/components/Header';
import DataTable from '@/components/DataTable';

// Mock data
const lorebooks = [
    { id: '1', name: 'Fantasy World Lore', entries: 156, characters: 12, creator: 'admin@jchatai.space', status: 'public' },
    { id: '2', name: 'Sci-Fi Universe', entries: 89, characters: 8, creator: 'user123@email.com', status: 'public' },
    { id: '3', name: 'Medieval History', entries: 234, characters: 15, creator: 'creator@email.com', status: 'private' },
    { id: '4', name: 'Modern Life', entries: 67, characters: 5, creator: 'designer@email.com', status: 'public' },
    { id: '5', name: 'Horror Elements', entries: 45, characters: 3, creator: 'dev@email.com', status: 'unlisted' },
];

export default function LorebooksPage() {
    const columns = [
        {
            key: 'name',
            header: 'Lorebook',
            render: (book: typeof lorebooks[0]) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--warning)] to-[var(--danger)] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <span className="font-medium">{book.name}</span>
                </div>
            ),
        },
        { key: 'entries', header: 'Entries' },
        { key: 'characters', header: 'Characters' },
        { key: 'creator', header: 'Creator' },
        {
            key: 'status',
            header: 'Status',
            render: (book: typeof lorebooks[0]) => (
                <span className={`badge ${book.status === 'public' ? 'badge-success' :
                        book.status === 'private' ? 'badge-warning' : 'badge-primary'
                    }`}>
                    {book.status}
                </span>
            ),
        },
    ];

    return (
        <div className="min-h-screen">
            <Header title="Lorebooks" subtitle="Manage knowledge bases" />

            <div className="p-8 animate-fade-in">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Total Lorebooks</p>
                        <p className="text-2xl font-bold mt-1">847</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Total Entries</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--accent)]">42,156</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Public</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--primary)]">621</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Private</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--warning)]">226</p>
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
                            <option>Most Entries</option>
                            <option>Most Characters</option>
                            <option>Newest</option>
                        </select>
                    </div>
                    <button className="btn btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Lorebook
                    </button>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={lorebooks} />
            </div>
        </div>
    );
}
