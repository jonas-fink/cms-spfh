import { useCallback, useEffect, useState } from 'react';
import { Card, SectionHeader } from '../components/shared';
import WorkSessionEditModal from '../components/zeiterfassung/WorkSessionEditModal';
import type { ApiClockStatus, ApiWorkSession } from '../types';
import { api } from '../utils/api';
import { formatMinutes, formatTime } from '../utils/format';

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

function StatusDot({ status }: { status: ApiClockStatus }) {
    if (status.active && status.onBreak)
        return (
            <span className="flex items-center gap-1.5 text-[12px] text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Pause
            </span>
        );
    if (status.active)
        return (
            <span className="flex items-center gap-1.5 text-[12px] text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Aktiv
            </span>
        );
    return (
        <span className="flex items-center gap-1.5 text-[12px] text-muted">
            <span className="w-2 h-2 rounded-full bg-muted/40" /> Offline
        </span>
    );
}

export default function AdminZeiterfassungPage() {
    const [statuses, setStatuses] = useState<ApiClockStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [sessions, setSessions] = useState<ApiWorkSession[]>([]);
    const [editing, setEditing] = useState<ApiWorkSession | null>(null);

    const load = useCallback(async () => {
        const data = await api.get<ApiClockStatus[]>('/work-sessions/all');
        setStatuses(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
        const iv = setInterval(load, 30_000); // Live-Status pollen
        return () => clearInterval(iv);
    }, [load]);

    const loadSessions = useCallback(async (userId: string) => {
        const { from, to } = weekRange();
        const list = await api.get<ApiWorkSession[]>(
            `/work-sessions/user/${userId}?from=${from.toISOString()}&to=${to.toISOString()}`,
        );
        setSessions(list);
    }, []);

    async function toggle(userId: string) {
        if (expanded === userId) {
            setExpanded(null);
            setSessions([]);
            return;
        }
        setExpanded(userId);
        await loadSessions(userId);
    }

    return (
        <div>
            <SectionHeader
                title="Zeiterfassung"
                sub="Live-Status · aktuelle Woche"
            />

            <Card className="mt-4">
                {loading ? (
                    <div className="py-8 text-center text-[13px] text-muted">
                        Lade…
                    </div>
                ) : (
                    <div className="divide-y divide-border overflow-x-auto min-w-0 [&>*]:min-w-[520px]">
                        <div className="px-4 py-2 grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-2 text-[11px] text-muted uppercase font-medium">
                            <span>Fachkraft</span>
                            <span>Status</span>
                            <span className="text-right">Heute</span>
                            <span className="text-right">Woche</span>
                            <span className="text-right">Saldo</span>
                        </div>
                        {statuses.map((s) => (
                            <div key={s.user.id}>
                                <button
                                    type="button"
                                    onClick={() => toggle(s.user.id)}
                                    className="w-full text-left px-4 py-3 grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center gap-2 hover:bg-surface-hover transition-colors cursor-pointer"
                                >
                                    <span className="text-[13px] text-text font-medium">
                                        {s.user.name}
                                    </span>
                                    <StatusDot status={s} />
                                    <span className="text-[12.5px] text-muted tabular-nums text-right">
                                        {formatMinutes(s.todayMinutes)}
                                    </span>
                                    <span className="text-[12.5px] text-muted tabular-nums text-right">
                                        {formatMinutes(s.weekMinutes)}
                                    </span>
                                    <span
                                        className={`text-[13px] font-medium tabular-nums text-right ${
                                            s.overtimeMinutes < 0
                                                ? 'text-red-600'
                                                : 'text-emerald-700'
                                        }`}
                                    >
                                        {formatMinutes(s.overtimeMinutes)}
                                    </span>
                                </button>
                                {expanded === s.user.id && (
                                    <div className="px-4 pb-3 bg-surface/40">
                                        {sessions.length === 0 ? (
                                            <p className="text-[12.5px] text-muted py-2 m-0">
                                                Keine Sitzungen diese Woche.
                                            </p>
                                        ) : (
                                            sessions.map((ws) => (
                                                <button
                                                    key={ws._id}
                                                    type="button"
                                                    onClick={() =>
                                                        setEditing(ws)
                                                    }
                                                    className="w-full text-left py-1.5 flex items-center justify-between gap-2 text-[12.5px] hover:text-text text-muted cursor-pointer"
                                                >
                                                    <span className="tabular-nums">
                                                        {formatTime(ws.clockIn)}{' '}
                                                        –{' '}
                                                        {ws.clockOut
                                                            ? formatTime(
                                                                  ws.clockOut,
                                                              )
                                                            : '…'}
                                                        {ws.manuallyEdited && (
                                                            <span className="ml-2 text-[10.5px] text-amber-700">
                                                                bearbeitet
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="tabular-nums">
                                                        {ws.totalMinutes != null
                                                            ? formatMinutes(
                                                                  ws.totalMinutes,
                                                              )
                                                            : 'aktiv'}
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
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
                        if (expanded) await loadSessions(expanded);
                        await load();
                    }}
                />
            )}
        </div>
    );
}
