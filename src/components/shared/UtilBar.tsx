import React from 'react';

interface UtilBarProps {
    percent: number;
    className?: string;
}

function barColor(pct: number): string {
    if (pct < 60) return '#94a3b8';
    if (pct < 90) return 'var(--accent)';
    if (pct < 106) return '#10b981';
    return '#f97316';
}

export default function UtilBar({ percent, className = '' }: UtilBarProps) {
    const capped = Math.min(percent, 100);
    const color = barColor(percent);
    const isTarget = percent >= 90 && percent < 106;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div
                className={`flex-1 h-1.5 rounded-full overflow-hidden relative ${isTarget ? 'bg-emerald-500/10' : 'bg-border'}`}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500"
                    style={{ width: `${capped}%`, background: color }}
                />
            </div>
            <span
                className="text-[12px] font-medium tabular-nums min-w-[34px] text-right"
                style={{ color }}
            >
                {Math.round(percent)}%
            </span>
        </div>
    );
}
