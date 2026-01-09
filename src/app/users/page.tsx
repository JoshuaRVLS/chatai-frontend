'use client';

import Header from '@/components/Header';
import DataTable from '@/components/DataTable';

// Mock data
const users = [
    { id: '1', name: 'John Doe', email: 'john.doe@email.com', status: 'active', role: 'User', createdAt: '2024-01-15' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@email.com', status: 'active', role: 'Premium', createdAt: '2024-01-10' },
    { id: '3', name: 'Bob Johnson', email: 'bob.j@email.com', status: 'inactive', role: 'User', createdAt: '2024-01-08' },
    { id: '4', name: 'Alice Williams', email: 'alice.w@email.com', status: 'banned', role: 'User', createdAt: '2024-01-05' },
    { id: '5', name: 'Charlie Brown', email: 'charlie.b@email.com', status: 'active', role: 'Admin', createdAt: '2024-01-01' },
];

export default function UsersPage() {
    const columns = [
        {
            key: 'name',
            header: 'Name',
            render: (user: typeof users[0]) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
                        <span className="text-white font-medium text-xs">{user.name.charAt(0)}</span>
                    </div>
                    <span className="font-medium">{user.name}</span>
                </div>
            ),
        },
        { key: 'email', header: 'Email' },
        {
            key: 'status',
            header: 'Status',
            render: (user: typeof users[0]) => (
                <span className={`badge ${user.status === 'active' ? 'badge-success' :
                        user.status === 'inactive' ? 'badge-warning' : 'badge-danger'
                    }`}>
                    {user.status}
                </span>
            ),
        },
        {
            key: 'role',
            header: 'Role',
            render: (user: typeof users[0]) => (
                <span className={`badge ${user.role === 'Admin' ? 'badge-primary' :
                        user.role === 'Premium' ? 'badge-success' : 'badge-warning'
                    }`}>
                    {user.role}
                </span>
            ),
        },
        { key: 'createdAt', header: 'Created' },
    ];

    return (
        <div className="min-h-screen">
            <Header title="Users" subtitle="Manage user accounts" />

            <div className="p-8 animate-fade-in">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Total Users</p>
                        <p className="text-2xl font-bold mt-1">12,847</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Active</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--accent)]">10,234</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Premium</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--primary)]">1,847</p>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Banned</p>
                        <p className="text-2xl font-bold mt-1 text-[var(--danger)]">156</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <select className="input w-auto">
                            <option>All Status</option>
                            <option>Active</option>
                            <option>Inactive</option>
                            <option>Banned</option>
                        </select>
                        <select className="input w-auto">
                            <option>All Roles</option>
                            <option>Admin</option>
                            <option>Premium</option>
                            <option>User</option>
                        </select>
                    </div>
                    <button className="btn btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add User
                    </button>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={users} />
            </div>
        </div>
    );
}
