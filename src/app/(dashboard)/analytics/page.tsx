'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface TrendData {
    date: string;
    count: number;
}

interface AnalyticsData {
    trends: {
        users: TrendData[];
        messages: TrendData[];
        characters: TrendData[];
    };
    metrics: {
        usersCreated: number;
        messagesSent: number;
        userGrowth: string;
        messageGrowth: string;
        retentionRate: number;
        avgSessionDuration: string;
    };
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics?days=${days}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Analytics fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [days]);

    const maxVal = (trend: TrendData[]) => Math.max(...trend.map(d => d.count), 1);

    return (
        <div className="min-h-screen">
            <Header title="Analytics" subtitle="Platform insights and metrics" />

            <div className="p-10 space-y-16 animate-fade-in">
                {/* Time Range Selector */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {[7, 30, 90].map((d) => (
                            <button
                                key={d}
                                onClick={() => setDays(d)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${days === d
                                    ? 'bg-white text-zinc-950 scale-105 shadow-lg'
                                    : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {d} Days
                            </button>
                        ))}
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {[
                        { label: 'New Users', val: data?.metrics.usersCreated || 0, change: data?.metrics.userGrowth, color: 'white' },
                        { label: 'Messages Sent', val: data?.metrics.messagesSent || 0, change: data?.metrics.messageGrowth, color: 'emerald-400' },
                        { label: 'Retention Rate', val: `${data?.metrics.retentionRate || 0}%`, change: '-1.2%', color: 'zinc-400' },
                        { label: 'Avg Session', val: data?.metrics.avgSessionDuration || '0m', change: '+5.4%', color: 'sky-400' },
                    ].map((m, i) => (
                        <div key={i} className="card-premium p-6 flex flex-col justify-between h-32">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{m.label}</p>
                            <div className="flex items-end justify-between">
                                <p className={`text-3xl font-black italic tracking-tighter uppercase leading-none text-${m.color}`}>{m.val.toLocaleString()}</p>
                                <span className={`text-[10px] font-bold ${m.change?.startsWith('+') ? 'text-emerald-500' : 'text-zinc-500'}`}>
                                    {m.change && (m.change.startsWith('+') || m.change.startsWith('-') ? m.change : `+${m.change}%`)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Trend Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* User Growth Chart */}
                    <div className="card-premium p-8 h-80 flex flex-col">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-8">User Acquisition Trend</h3>
                        <div className="flex-1 flex items-end gap-1.5 min-h-0">
                            {loading ? (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-zinc-800">Processing global data...</div>
                            ) : data?.trends.users.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-white/5 group-hover:bg-white/20 transition-all rounded-t-sm relative"
                                        style={{ height: `${(d.count / maxVal(data.trends.users)) * 100}%` }}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            <span className="text-[10px] font-black text-white">{d.count}</span>
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-bold text-zinc-700 uppercase rotate-45 mt-2 origin-left">{d.date.slice(5)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Messages Chart */}
                    <div className="card-premium p-8 h-80 flex flex-col">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-8">Message Volume Activity</h3>
                        <div className="flex-1 flex items-end gap-1.5 min-h-0">
                            {loading ? (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-zinc-800">Calculating system load...</div>
                            ) : data?.trends.messages.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-emerald-500/10 group-hover:bg-emerald-500/30 transition-all rounded-t-sm relative"
                                        style={{ height: `${(d.count / maxVal(data.trends.messages)) * 100}%` }}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            <span className="text-[10px] font-black text-emerald-400">{d.count}</span>
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-bold text-zinc-700 uppercase rotate-45 mt-2 origin-left">{d.date.slice(5)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
