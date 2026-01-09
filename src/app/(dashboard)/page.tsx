'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import { useRouter } from 'next/navigation';

interface DashboardData {
  stats: {
    users: number;
    characters: number;
    conversations: number;
    messages: number;
  };
  topCharacters: Array<{
    id: string;
    name: string;
    conversations: number;
    growth: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    user: string;
    time: string;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleAction = (label: string) => {
    switch (label) {
      case 'Add User':
        router.push('/users');
        break;
      case 'Add Character':
        router.push('/characters');
        break;
      case 'Add Lorebook':
        router.push('/lorebooks');
        break;
      case 'System Settings':
        router.push('/settings');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Dashboard stats error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'character':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'chat':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="System Dashboard" subtitle="Overview of platform performance" />

      <div className="space-y-16 mt-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <StatsCard
            title="Total Users"
            value={loading ? "..." : formatNumber(data?.stats.users || 0)}
            change="Real-time"
            changeType="positive"
            icon={
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
              </svg>
            }
          />
          <StatsCard
            title="AI Characters"
            value={loading ? "..." : formatNumber(data?.stats.characters || 0)}
            change="Active Content"
            changeType="positive"
            icon={
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Conversations"
            value={loading ? "..." : formatNumber(data?.stats.conversations || 0)}
            change="Active Chats"
            changeType="positive"
            icon={
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
          />
          <StatsCard
            title="Total Messages"
            value={loading ? "..." : formatNumber(data?.stats.messages || 0)}
            change="System Load"
            changeType="positive"
            icon={
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 0 002.22 0L21 8M5 19h14a2 0 002-2V7a2 0 00-2-2H5a2 0 00-2 2v10a2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Recent Activity */}
          <div className="lg:col-span-2 glass rounded-3xl p-8 border border-white/5">
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">System Live Stream</h2>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Live Feed</span>
              </div>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-700 p-4">Loading application events...</div>
              ) : data?.recentActivity.length ? (
                data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-5 p-4 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/2.5 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-white group-hover:bg-white/5 transition-all shadow-inner">
                      {getActivityIcon((activity as any).type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide text-zinc-300 group-hover:text-white transition-colors">{activity.action}</p>
                      <p className="text-[10px] font-bold text-zinc-600 lowercase truncate mt-0.5">Executor: {activity.user}</p>
                    </div>
                    <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest shrink-0 whitespace-nowrap">{formatTimeAgo(activity.time)}</span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-700 p-4 text-center">No recent activity detected</div>
              )}
            </div>
          </div>

          {/* Top Characters */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Leaderboard</h2>
              <button className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                Details
              </button>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-700 p-4">Calculating rankings...</div>
              ) : data?.topCharacters.length ? (
                data.topCharacters.map((character, index) => (
                  <div
                    key={character.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/2.5 transition-all duration-300 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <span className="text-white font-black text-[10px]">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide text-zinc-300">{character.name}</p>
                      <p className="text-[10px] font-bold text-zinc-600 lowercase">{character.conversations.toLocaleString()} chats</p>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400/60 ">{character.growth}</span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-700 p-4 text-center">No characters found</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 px-2">Quick Commands</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {[
              { label: 'Add User', desc: 'Manage access', color: 'zinc', icon: 'M12 4v16m8-8H4' },
              { label: 'Add Character', desc: 'Moderation hub', color: 'zinc', icon: 'M17 20h5v-2a3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
              { label: 'Add Lorebook', desc: 'Control knowledge', color: 'zinc', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { label: 'System Settings', desc: 'Global config', color: 'zinc', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => handleAction(action.label)}
                className="card-premium flex items-center gap-5 hover:border-white/20 transition-all group group-active:scale-[0.95]"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:text-zinc-950 transition-all shadow-inner">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={action.icon} />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-200">{action.label}</p>
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter mt-0.5">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
