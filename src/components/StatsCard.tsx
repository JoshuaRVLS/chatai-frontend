interface StatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
}

export default function StatsCard({ title, value, change, changeType = 'neutral', icon }: StatsCardProps) {
    const changeColors = {
        positive: 'text-emerald-400',
        negative: 'text-red-400',
        neutral: 'text-zinc-600',
    };

    return (
        <div className="card-premium group transition-all duration-300">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2">{title}</p>
                    <p className="text-3xl font-black italic tracking-tighter uppercase leading-none">{value}</p>
                    {change && (
                        <p className={`text-[10px] font-bold mt-3 inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/5 uppercase tracking-widest ${changeColors[changeType]}`}>
                            {changeType === 'positive' && '↑ '}
                            {changeType === 'negative' && '↓ '}
                            {change}
                        </p>
                    )}
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 text-white/40 group-hover:text-white group-hover:bg-white/10 border border-white/5 transition-all duration-300">
                    <span className="scale-110 block">{icon}</span>
                </div>
            </div>
        </div>
    );
}
