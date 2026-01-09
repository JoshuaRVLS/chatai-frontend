import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';

// Mock data for recent activity
const recentActivity = [
  { id: 1, action: 'New user registered', user: 'john.doe@email.com', time: '5 minutes ago' },
  { id: 2, action: 'Character created', user: 'admin@jchatai.space', time: '15 minutes ago' },
  { id: 3, action: 'Conversation started', user: 'user123@gmail.com', time: '32 minutes ago' },
  { id: 4, action: 'Lorebook published', user: 'creator@email.com', time: '1 hour ago' },
  { id: 5, action: 'User upgraded to premium', user: 'premium@email.com', time: '2 hours ago' },
];

const topCharacters = [
  { id: 1, name: 'Luna', conversations: 12543, growth: '+15%' },
  { id: 2, name: 'Atlas', conversations: 9821, growth: '+8%' },
  { id: 3, name: 'Nova', conversations: 7654, growth: '+22%' },
  { id: 4, name: 'Echo', conversations: 5432, growth: '+5%' },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle="Welcome back, Admin" />

      <div className="p-8 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Users"
            value="12,847"
            change="+12.5% from last month"
            changeType="positive"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
              </svg>
            }
          />
          <StatsCard
            title="Active Characters"
            value="1,248"
            change="+8.2% from last month"
            changeType="positive"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Conversations Today"
            value="34,521"
            change="+24.5% from yesterday"
            changeType="positive"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
          />
          <StatsCard
            title="Messages Sent"
            value="1.2M"
            change="+18.7% from last month"
            changeType="positive"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{activity.user}</p>
                  </div>
                  <span className="text-xs text-[var(--muted)]">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Characters */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Top Characters</h2>
              <button className="text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {topCharacters.map((character, index) => (
                <div
                  key={character.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{character.name}</p>
                    <p className="text-xs text-[var(--muted)]">{character.conversations.toLocaleString()} conversations</p>
                  </div>
                  <span className="text-xs font-medium text-[var(--accent)]">{character.growth}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="card flex items-center gap-4 hover:border-[var(--primary)] transition-all group">
              <div className="p-3 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">Add User</p>
                <p className="text-xs text-[var(--muted)]">Create new user account</p>
              </div>
            </button>
            <button className="card flex items-center gap-4 hover:border-[var(--accent)] transition-all group">
              <div className="p-3 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">Add Character</p>
                <p className="text-xs text-[var(--muted)]">Create new AI character</p>
              </div>
            </button>
            <button className="card flex items-center gap-4 hover:border-[var(--warning)] transition-all group">
              <div className="p-3 rounded-xl bg-[var(--warning)]/10 text-[var(--warning)] group-hover:bg-[var(--warning)] group-hover:text-white transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">Add Lorebook</p>
                <p className="text-xs text-[var(--muted)]">Create knowledge base</p>
              </div>
            </button>
            <button className="card flex items-center gap-4 hover:border-[var(--danger)] transition-all group">
              <div className="p-3 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] group-hover:bg-[var(--danger)] group-hover:text-white transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">Settings</p>
                <p className="text-xs text-[var(--muted)]">Configure system</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
