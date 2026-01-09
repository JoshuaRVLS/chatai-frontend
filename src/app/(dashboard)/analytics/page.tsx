'use client';

import Header from '@/components/Header';

export default function AnalyticsPage() {
    return (
        <div className="min-h-screen">
            <Header title="Analytics" subtitle="Platform insights and metrics" />

            <div className="p-8 animate-fade-in">
                {/* Time Range Selector */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] text-white">Today</button>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--card)]">7 Days</button>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--card)]">30 Days</button>
                    </div>
                    <button className="btn btn-secondary">Export Report</button>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Daily Active Users</p>
                        <p className="text-3xl font-bold mt-2">4,521</p>
                        <span className="text-xs text-[var(--accent)]">+12.5%</span>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Avg Session Duration</p>
                        <p className="text-3xl font-bold mt-2">23m 45s</p>
                        <span className="text-xs text-[var(--accent)]">+8.2%</span>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Messages per Session</p>
                        <p className="text-3xl font-bold mt-2">47</p>
                        <span className="text-xs text-[var(--accent)]">+15.7%</span>
                    </div>
                    <div className="card">
                        <p className="text-sm text-[var(--muted-foreground)]">Retention Rate</p>
                        <p className="text-3xl font-bold mt-2">68%</p>
                        <span className="text-xs text-[var(--danger)]">-2.1%</span>
                    </div>
                </div>

                {/* Charts Placeholder */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card h-64 flex items-center justify-center">
                        <p className="text-[var(--muted)]">User Growth Chart</p>
                    </div>
                    <div className="card h-64 flex items-center justify-center">
                        <p className="text-[var(--muted)]">Conversations Over Time</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
