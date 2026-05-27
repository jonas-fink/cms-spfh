import { DAY_LABELS, formatDuration, isSameDay } from '../../utils/format';

interface WeeklyChartProps {
    minutesPerDay: number[];
    weekDays: Date[];
    totalMinutes: number;
    kw: number;
}

const WeeklyChart = ({
    minutesPerDay,
    weekDays,
    totalMinutes,
    kw,
}: WeeklyChartProps) => {
    const today = new Date();
    const maxMins = Math.max(...minutesPerDay, 30);

    const totalH = Math.floor(totalMinutes / 60);
    const totalM = totalMinutes % 60;

    return (
        <div className="bg-surface border border-border rounded-lg p-5">
            <div className="flex items-end gap-2" style={{ height: 100 }}>
                {weekDays.map((day, i) => {
                    const mins = minutesPerDay[i];
                    const heightPct =
                        mins > 0 ? Math.max((mins / maxMins) * 100, 6) : 0;
                    const isToday = isSameDay(day, today);
                    const isFuture = day > today && !isToday;

                    return (
                        <div
                            key={i}
                            className="flex-1 flex flex-col items-center justify-end gap-2"
                            style={{ height: '100%' }}
                        >
                            <div
                                className="w-full rounded-sm transition-all duration-500"
                                style={{
                                    height: mins > 0 ? `${heightPct}%` : 2,
                                    background: isToday
                                        ? 'var(--accent)'
                                        : isFuture
                                          ? 'var(--border)'
                                          : mins > 0
                                            ? 'var(--border-strong)'
                                            : 'var(--border)',
                                    opacity: isFuture ? 0.4 : 1,
                                    minHeight: 2,
                                }}
                            />
                            <span
                                className="text-[11px] font-medium leading-none"
                                style={{
                                    color: isToday
                                        ? 'var(--accent)'
                                        : 'var(--text-mute)',
                                    fontWeight: isToday ? 600 : 400,
                                }}
                            >
                                {DAY_LABELS[i]}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[11.5px] text-muted">
                    Gesamt:{' '}
                    <span className="text-text font-medium">
                        {formatDuration(totalH, totalM)}
                    </span>
                </span>
                <span className="text-[11.5px] text-muted">KW {kw}</span>
            </div>
        </div>
    );
};

export default WeeklyChart;
