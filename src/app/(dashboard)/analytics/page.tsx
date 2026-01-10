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

    const [generating, setGenerating] = useState(false);
    const [reportTimestamp, setReportTimestamp] = useState(Date.now());

    const generateReport = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/analytics/generate-report', { method: 'POST' });
            if (res.ok) {
                setReportTimestamp(Date.now());
            } else {
                alert('Failed to generate report');
            }
        } catch (error) {
            console.error("Report generation error:", error);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-start justify-between">
                <Header title="Analytics" subtitle="Platform insights and metrics" />
                <button
                    onClick={generateReport}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span>Generate Python Report</span>
                        </>
                    )}
                </button>
            </div>

            <div className="space-y-16 animate-fade-in mt-8">
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

                {/* Detailed Python Report */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Daily Health Report (Python Generated)</h2>
                        <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Last Updated: {new Date(reportTimestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="w-full aspect-20/12 bg-zinc-950 rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative group">
                        <img
                            src={`/reports/analytics_dashboard.png?t=${reportTimestamp}`}
                            alt="Daily Analytics Report"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                // Hide broken image if report doesn't exist yet
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = `
                                    <div class="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 gap-4">
                                        <svg class="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25" />
                                        </svg>
                                        <p class="font-bold uppercase tracking-widest text-xs">No Report Generated Yet</p>
                                        <p class="text-[10px] text-zinc-800">Click the button above to generate one.</p>
                                    </div>
                                `;
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
