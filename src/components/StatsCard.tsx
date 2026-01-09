interface StatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
}

export default function StatsCard({ title, value, change, changeType = 'neutral', icon }: StatsCardProps) {
    const changeColors = {
        positive: 'text-[var(--accent)]',
        negative: 'text-[var(--danger)]',
        neutral: 'text-[var(--muted)]',
    };

    return (
        <div className="card hover:border-[var(--primary)] group transition-all duration-300">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-[var(--muted-foreground)] mb-1">{title}</p>
                    <p className="text-3xl font-bold tracking-tight">{value}</p>
                    {change && (
                        <p className={`text-sm mt-2 ${changeColors[changeType]}`}>
                            {changeType === 'positive' && '↑ '}
                            {changeType === 'negative' && '↓ '}
                            {change}
                        </p>
                    )}
                </div>
                <div className="p-3 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all duration-300">
                    {icon}
                </div>
            </div>
        </div>
    );
}
