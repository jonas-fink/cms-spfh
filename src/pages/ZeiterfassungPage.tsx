import { useCallback, useEffect, useState } from 'react';
import { Card, KPICard, SectionHeader } from '../components/shared';
import WorkSessionEditModal from '../components/zeiterfassung/WorkSessionEditModal';
import type { ApiOvertime, ApiWorkSession } from '../types';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatMinutes, formatTime } from '../utils/format';

function weekRange(): { from: Date; to: Date } {
    const now = new Date();
    const dow = now.getDay() || 7;
    const from = new Date(now);
    from.setDate(now.getDate() - dow + 1);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
    return { from, to };
}

export default function ZeiterfassungPage() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<ApiWorkSession[]>([]);
    const [overtime, setOvertime] = useState<ApiOvertime | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<ApiWorkSession | null>(null);

    // ponytail: nur aktuelle Woche, keine Wochen-Navigation. Reicht für die Demo.
    const load = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { from, to } = weekRange();
        const [list, ot] = await Promise.all([
            api.get<ApiWorkSession[]>(
                `/work-sessions/me?from=${from.toISOString()}&to=${to.toISOString()}`,
            ),
            api.get<ApiOvertime>(`/work-sessions/overtime/${user.id}`),
        ]);
        setSessions(list);
        setOvertime(ot);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div>
            <SectionHeader title="Zeiterfassung" sub="Diese Woche" />

            <div className="grid grid-cols-3 gap-3 my-4">
                <KPICard
                    label="Geleistet"
                    value={formatMinutes(overtime?.weekMinutes ?? 0)}
                />
                <KPICard
                    label="Wochen-Soll"
                    value={formatMinutes(overtime?.weeklyTargetMinutes ?? 0)}
                />
                <KPICard
                    label="Überstunden-Saldo"
                    value={formatMinutes(overtime?.overtimeMinutes ?? 0)}
                />
            </div>

            <Card>
                {loading ? (
                    <div className="py-8 text-center text-[13px] text-muted">
                        Lade…
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="py-8 text-center text-[13px] text-muted">
                        Keine Sitzungen in dieser Woche.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {sessions.map((s) => (
                            <button
                                key={s._id}
                                type="button"
                                onClick={() => setEditing(s)}
                                className="w-full text-left px-4 py-3 grid grid-cols-[1.3fr_1fr_1fr_0.8fr] items-center gap-2 hover:bg-surface-hover transition-colors cursor-pointer"
                            >
                                <span className="text-[13px] text-text font-medium">
                                    {formatDate(s.date, { relative: true })}
                                    {s.manuallyEdited && (
                                        <span className="ml-2 text-[10.5px] text-amber-700">
                                            bearbeitet
                                        </span>
                                    )}
                                </span>
                                <span className="text-[12.5px] text-muted tabular-nums">
                                    {formatTime(s.clockIn)} –{' '}
                                    {s.clockOut ? formatTime(s.clockOut) : '…'}
                                </span>
                                <span className="text-[12.5px] text-muted">
                                    {s.breaks.length > 0
                                        ? `${s.breaks.length} Pause(n)`
                                        : 'keine Pause'}
                                </span>
                                <span className="text-[13px] text-text font-medium tabular-nums text-right">
                                    {s.totalMinutes != null
                                        ? formatMinutes(s.totalMinutes)
                                        : 'aktiv'}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </Card>

            {editing && (
                <WorkSessionEditModal
                    session={editing}
                    onClose={() => setEditing(null)}
                    onSaved={async () => {
                        setEditing(null);
                        await load();
                    }}
                />
            )}
        </div>
    );
}
