import { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    Card,
    HoursRing,
    KPICard,
    SectionHeader,
    UtilBar,
} from '../components/shared';
import { api } from '../utils/api';
import { FK_COLORS } from '../utils/colors';
import { formatDuration, getISOWeek } from '../utils/format';
import type { ApiWorkloadEntry } from '../types';

function fmtHours(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return formatDuration(h, m);
}

export default function AdminStatsPage() {
    const [workload, setWorkload] = useState<ApiWorkloadEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                setLoading(true);
                setError(null);
                const data =
                    await api.get<ApiWorkloadEntry[]>('/stats/workload');
                if (!cancelled) setWorkload(data);
            } catch (err) {
                if (!cancelled)
                    setError((err as Error).message ?? 'Fehler beim Laden');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const totals = useMemo(() => {
        const totalQuota = workload.reduce((s, w) => s + w.quotaMinutes, 0);
        const totalWorked = workload.reduce((s, w) => s + w.workedMinutes, 0);
        const totalPerformed = workload.reduce(
            (s, w) => s + w.performedMinutes,
            0,
        );
        const totalCancelledCredit = workload.reduce(
            (s, w) => s + w.cancelledCreditMinutes,
            0,
        );
        const totalAppts = workload.reduce(
            (s, w) => s + w.appointmentsThisWeek,
            0,
        );
        const overdueSum = workload.reduce((s, w) => s + w.overdueReports, 0);
        const avgUtil =
            totalQuota > 0 ? Math.round((totalWorked / totalQuota) * 100) : 0;
        const maxWorked = Math.max(1, ...workload.map((w) => w.workedMinutes));
        return {
            totalQuota,
            totalWorked,
            totalPerformed,
            totalCancelledCredit,
            totalAppts,
            overdueSum,
            avgUtil,
            maxWorked,
        };
    }, [workload]);

    if (error) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-[13px] text-red-600">
                {error}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-[13px] text-muted">
                Lade Auslastung…
            </div>
        );
    }

    const kw = getISOWeek(new Date());

    return (
        <div>
            <div className="mb-5">
                <h1 className="text-[24px] font-semibold text-text tracking-[-0.02em]">
                    Auslastung
                </h1>
                <p className="text-[13px] text-muted mt-0.5">
                    Detail-Übersicht · KW {kw}
                </p>
            </div>

            <div
                className="grid gap-3.5 mb-7 grid-cols-2 lg:grid-cols-4"
            >
                <KPICard
                    label="Ø Auslastung"
                    value={`${totals.avgUtil}%`}
                    sub={`${workload.length} Fachkräfte`}
                    trendPositive={
                        totals.avgUtil >= 90 && totals.avgUtil <= 105
                    }
                    warning={totals.avgUtil > 105}
                />
                <KPICard
                    label="Geleistete Stunden"
                    value={fmtHours(totals.totalWorked)}
                    sub={`von ${fmtHours(totals.totalQuota)} Soll`}
                />
                <KPICard
                    label="Termine"
                    value={String(totals.totalAppts)}
                    sub="diese Woche"
                />
                <KPICard
                    label="Berichte überfällig"
                    value={String(totals.overdueSum)}
                    sub="alle Fachkräfte"
                    warning={totals.overdueSum > 0}
                />
            </div>

            {/* Verteilung: Bar-Chart pro FK */}
            <div className="mb-7">
                <SectionHeader
                    title="Stunden-Verteilung"
                    sub="Geleistete vs. vereinbarte Wochenstunden pro Fachkraft"
                />
                <Card>
                    {workload.length === 0 ? (
                        <div className="p-5 text-center text-[13px] text-muted">
                            Keine Daten vorhanden.
                        </div>
                    ) : (
                        <div className="p-5 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-5">
                            {workload.map((w, i) => {
                                const color = FK_COLORS[i % FK_COLORS.length];
                                const firstName =
                                    w.fachkraft.name.split(' ')[0];
                                return (
                                    <div
                                        key={w.fachkraft.id}
                                        className="flex flex-col items-center gap-2 min-w-0"
                                        title={`Geleistet ${fmtHours(w.workedMinutes)} · Soll ${fmtHours(w.quotaMinutes)}`}
                                    >
                                        <HoursRing
                                            minutes={w.workedMinutes}
                                            quotaHours={w.quotaMinutes / 60}
                                            size={76}
                                        />
                                        <div className="flex flex-col items-center gap-1 min-w-0 w-full">
                                            <Avatar
                                                name={w.fachkraft.name}
                                                size={22}
                                                color={color}
                                            />
                                            <span className="text-[11.5px] text-text font-medium truncate w-full text-center">
                                                {firstName}
                                            </span>
                                            <span className="text-[10.5px] text-muted tabular-nums">
                                                {w.utilizationPercent}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="px-5 py-3 border-t border-border text-[11.5px] text-muted">
                        Ring = geleistete Stunden (inkl. Ausfall-Gutschrift) im
                        Verhältnis zum Wochen-Soll.
                    </div>
                </Card>
            </div>

            {/* Detail-Tabelle */}
            <div>
                <SectionHeader
                    title="Detail-Aufschlüsselung"
                    sub="Performed · Ausfall-Gutschrift · Auslastung"
                />
                <Card>
                    {(() => {
                        const COLS = '1.8fr 80px 90px 110px 110px 1fr 70px';
                        return (
                            <>
                                <div className="overflow-x-auto">
                                <div className="min-w-[860px]">
                                <div
                                    className="grid gap-4 px-4 py-2.5 border-b border-border"
                                    style={{ gridTemplateColumns: COLS }}
                                >
                                    {(
                                        [
                                            'Fachkraft',
                                            'Klienten',
                                            'Soll',
                                            'Performed',
                                            'Ausfall-Gutschrift',
                                            'Auslastung',
                                            'Termine',
                                        ] as const
                                    ).map((h) => (
                                        <span
                                            key={h}
                                            className="text-[11px] font-medium text-muted uppercase tracking-widest"
                                        >
                                            {h}
                                        </span>
                                    ))}
                                </div>
                                {workload.map((w, i) => (
                                    <div
                                        key={w.fachkraft.id}
                                        className={[
                                            'grid gap-4 px-4 py-3 items-center',
                                            i < workload.length - 1
                                                ? 'border-b border-border'
                                                : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        style={{ gridTemplateColumns: COLS }}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Avatar
                                                name={w.fachkraft.name}
                                                size={26}
                                                color={
                                                    FK_COLORS[
                                                        i % FK_COLORS.length
                                                    ]
                                                }
                                            />
                                            <span className="text-[13px] font-medium text-text truncate">
                                                {w.fachkraft.name}
                                            </span>
                                        </div>
                                        <span className="text-[13px] text-text tabular-nums">
                                            {w.clientCount}
                                            <span className="text-muted">
                                                /{w.maxClients}
                                            </span>
                                        </span>
                                        <span className="text-[13px] text-text tabular-nums">
                                            {fmtHours(w.quotaMinutes)}
                                        </span>
                                        <span className="text-[13px] text-text tabular-nums">
                                            {fmtHours(w.performedMinutes)}
                                        </span>
                                        <span className="text-[13px] text-muted tabular-nums">
                                            {w.cancelledCreditedCount > 0
                                                ? `${w.cancelledCreditedCount}× · ${fmtHours(w.cancelledCreditMinutes)}`
                                                : '—'}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <UtilBar
                                                    percent={
                                                        w.utilizationPercent
                                                    }
                                                />
                                            </div>
                                            <span className="text-[12px] text-muted tabular-nums w-9 text-right">
                                                {w.utilizationPercent}%
                                            </span>
                                        </div>
                                        <span className="text-[13px] text-text tabular-nums">
                                            {w.appointmentsThisWeek}
                                        </span>
                                    </div>
                                ))}
                                </div>
                                </div>
                                {workload.length === 0 && (
                                    <div className="px-4 py-10 text-center text-[13px] text-muted">
                                        Keine Daten.
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </Card>
            </div>
        </div>
    );
}
