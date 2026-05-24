import React, { useEffect, useState } from 'react';

interface HoursRingProps {
    minutes: number;
    quotaHours: number;
    size?: number;
    strokeWidth?: number;
    showLabel?: boolean;
}

function ringColor(pct: number): string {
    if (pct < 50) return '#94a3b8';
    if (pct < 90) return 'var(--accent)';
    if (pct < 105) return '#10b981';
    return '#f97316';
}

function formatMinutes(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}:${String(m).padStart(2, '0')}h`;
}

export default function HoursRing({
    minutes,
    quotaHours,
    size = 56,
    strokeWidth = 6,
    showLabel = true,
}: HoursRingProps) {
    const quotaMinutes = quotaHours * 60;
    const rawPct = quotaMinutes > 0 ? (minutes / quotaMinutes) * 100 : 0;
    const pct = Math.min(rawPct, 100);
    const radius = (size - strokeWidth) / 2;
    const circumf = 2 * Math.PI * radius;

    const [animPct, setAnimPct] = useState(0);
    useEffect(() => {
        const id = requestAnimationFrame(() => setAnimPct(pct));
        return () => cancelAnimationFrame(id);
    }, [pct]);

    return (
        <div
            className="relative shrink-0"
            style={{ width: size, height: size }}
        >
            <svg
                width={size}
                height={size}
                style={{ transform: 'rotate(-90deg)' }}
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={ringColor(rawPct)}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    style={{
                        strokeDasharray: `${(animPct / 100) * circumf} ${circumf}`,
                        transition: 'stroke-dasharray 0.5s ease',
                    }}
                />
            </svg>

            {showLabel && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-px pointer-events-none">
                    <span
                        className="font-semibold text-text leading-none tabular-nums"
                        style={{
                            fontSize: size * 0.26,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {formatMinutes(minutes)}
                    </span>
                    <span
                        className="text-muted leading-none"
                        style={{ fontSize: size * 0.18 }}
                    >
                        {quotaHours}h
                    </span>
                </div>
            )}
        </div>
    );
}
