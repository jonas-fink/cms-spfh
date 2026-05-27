import { Avatar, UtilBar } from '../shared';

export interface FachkraftWorkload {
    id: string;
    name: string;
    color: string;
    activeClients: number;
    maxClients: number;
    minutesThisWeek: number;
    quotaMinutesThisWeek: number;
    appointmentsThisWeek: number;
    overdueReports: number;
}

interface WorkloadTableProps {
    data: FachkraftWorkload[];
    onRowClick?: (id: string) => void;
}

function utilPercent(minutes: number, quota: number): number {
    if (quota === 0) return 0;
    return Math.round((minutes / quota) * 100);
}

const WorkloadTable = ({ data, onRowClick }: WorkloadTableProps) => {
    const COLS = '2fr 72px 1fr 72px 72px';

    return (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
            {/* Table Header */}
            <div
                className="grid gap-4 px-4 py-2.5 border-b border-border"
                style={{ gridTemplateColumns: COLS }}
            >
                {(
                    [
                        'Fachkraft',
                        'Klienten',
                        'Auslastung KW',
                        'Termine',
                        'Überfällig',
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

            {/* Rows */}
            {data.map((fk, i) => {
                const pct = utilPercent(
                    fk.minutesThisWeek,
                    fk.quotaMinutesThisWeek,
                );
                return (
                    <div
                        key={fk.id}
                        className={[
                            'grid gap-4 px-4 py-3 items-center transition-colors duration-100',
                            i < data.length - 1 ? 'border-b border-border' : '',
                            onRowClick
                                ? 'cursor-pointer hover:bg-surface-hover'
                                : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        style={{ gridTemplateColumns: COLS }}
                        onClick={() => onRowClick?.(fk.id)}
                    >
                        {/* Name + Avatar */}
                        <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar name={fk.name} size={28} color={fk.color} />
                            <span className="text-[13px] font-[450] text-text truncate">
                                {fk.name}
                            </span>
                        </div>

                        {/* Klienten Zähler */}
                        <span className="text-[13px] text-text tabular-nums">
                            {fk.activeClients}
                            <span className="text-muted">/{fk.maxClients}</span>
                        </span>

                        {/* UtilBar + Prozentzahl */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <UtilBar percent={pct} />
                            </div>
                            <span className="text-[12px] text-muted tabular-nums w-9 text-right">
                                {pct}%
                            </span>
                        </div>

                        {/* Termine */}
                        <span className="text-[13px] text-text tabular-nums">
                            {fk.appointmentsThisWeek}
                        </span>

                        {/* Überfällige Berichte */}
                        <span
                            className={[
                                'text-[13px] font-[450] tabular-nums',
                                fk.overdueReports > 0
                                    ? 'text-[#dc2626]'
                                    : 'text-muted',
                            ].join(' ')}
                        >
                            {fk.overdueReports > 0 ? fk.overdueReports : '—'}
                        </span>
                    </div>
                );
            })}

            {data.length === 0 && (
                <div className="px-4 py-10 text-center text-[13px] text-muted">
                    Keine Fachkräfte vorhanden.
                </div>
            )}
        </div>
    );
};

export default WorkloadTable;
