import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    Avatar,
    Card,
    SectionHeader,
    StatusPill,
    UtilBar,
    FilterBtn,
} from '../components/shared';
import { api } from '../utils/api';
import { pickFkColor } from '../utils/colors';
import type { Client, ClientStatus, PopulatedUser } from '../types';

interface ApiClient {
    _id: string;
    id?: string;
    familyName: string;
    caseNumber: string;
    assignedFachkraefte: PopulatedUser[];
    weeklyHoursQuota: number;
    status: ClientStatus;
    startDate: string;
    children: { name: string; age: number }[];
}

interface ApiClientHours {
    totalMinutes: number;
    quotaMinutes: number;
    progressPercent: number;
}

type StatusFilter = 'alle' | ClientStatus;

const STATUS_FILTERS: StatusFilter[] = [
    'alle',
    'aktiv',
    'pausiert',
    'abgeschlossen',
];

function utilPercent(minutes: number, quota: number): number {
    if (quota === 0) return 0;
    return Math.round((minutes / quota) * 100);
}

export default function AdminClientsPage() {
    const navigate = useNavigate();
    const [clients, setClients] = useState<
        Array<
            Client & {
                minutesThisWeek: number;
                _fkDetails: PopulatedUser[];
            }
        >
    >([]);
    const [filter, setFilter] = useState<StatusFilter>('alle');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);
                const apiClients = await api.get<ApiClient[]>('/clients');
                if (cancelled) return;

                // Stunden pro Klient parallel laden (Workload-Endpoint pro Klient)
                const hoursList = await Promise.all(
                    apiClients.map((c) =>
                        api
                            .get<ApiClientHours>(
                                `/stats/clients/${c.id ?? c._id}/hours`,
                            )
                            .catch(() => ({
                                totalMinutes: 0,
                                quotaMinutes: 0,
                                progressPercent: 0,
                            })),
                    ),
                );
                if (cancelled) return;

                const mapped = apiClients.map((c, i) => ({
                    id: c.id ?? c._id,
                    familyName: c.familyName,
                    caseNumber: c.caseNumber,
                    assignedFachkraefte: c.assignedFachkraefte.map(
                        (u) => u.id ?? u._id,
                    ),
                    weeklyHoursQuota: c.weeklyHoursQuota,
                    minutesThisWeek: hoursList[i].totalMinutes,
                    status: c.status,
                    startDate: c.startDate,
                    children: c.children,
                    _fkDetails: c.assignedFachkraefte,
                }));
                setClients(mapped);
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

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return clients.filter((c) => {
            if (filter !== 'alle' && c.status !== filter) return false;
            if (
                q &&
                !`${c.familyName} ${c.caseNumber}`.toLowerCase().includes(q)
            )
                return false;
            return true;
        });
    }, [clients, filter, search]);

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
                Lade Klienten…
            </div>
        );
    }

    const COLS = '2fr 1fr 1.4fr 80px 1.2fr 100px';

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-[24px] font-semibold text-text tracking-[-0.02em]">
                        Klienten
                    </h1>
                    <p className="text-[13px] text-muted mt-0.5">
                        {clients.length} gesamt ·{' '}
                        {clients.filter((c) => c.status === 'aktiv').length}{' '}
                        aktiv
                    </p>
                </div>
            </div>

            {/* Filter + Search */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                {STATUS_FILTERS.map((s) => (
                    <FilterBtn
                        key={s}
                        label={s === 'alle' ? 'Alle' : s}
                        active={filter === s}
                        onClick={() => setFilter(s)}
                    />
                ))}
                <div className="flex-1 min-w-40" />
                <input
                    type="search"
                    placeholder="Familie oder Aktenzeichen suchen…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 px-3 rounded-md bg-bg border border-border text-[12.5px] text-text outline-none focus:border-accent w-70"
                />
            </div>

            <Card>
                <div className="px-4 py-3 border-b border-border">
                    <SectionHeader
                        title="Alle Klienten"
                        sub={`${filtered.length} angezeigt`}
                    />
                </div>

                {/* Header-Row */}
                <div
                    className="grid gap-4 px-4 py-2.5 border-b border-border"
                    style={{ gridTemplateColumns: COLS }}
                >
                    {(
                        [
                            'Familie',
                            'Aktenzeichen',
                            'Fachkräfte',
                            'Quote',
                            'Auslastung KW',
                            'Status',
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

                {filtered.length === 0 && (
                    <div className="px-4 py-10 text-center text-[13px] text-muted">
                        Keine Klienten gefunden.
                    </div>
                )}

                {filtered.map((c, i) => {
                    const quotaMinutes = c.weeklyHoursQuota * 60;
                    const pct = utilPercent(c.minutesThisWeek, quotaMinutes);
                    return (
                        <div
                            key={c.id}
                            onClick={() => navigate(`/admin/clients/${c.id}`)}
                            className={[
                                'grid gap-4 px-4 py-3 items-center cursor-pointer hover:bg-surface-hover transition-colors duration-100',
                                i < filtered.length - 1
                                    ? 'border-b border-border'
                                    : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            style={{ gridTemplateColumns: COLS }}
                        >
                            <div className="min-w-0">
                                <div className="text-[13px] font-medium text-text truncate">
                                    Familie {c.familyName}
                                </div>
                                <div className="text-[11.5px] text-muted">
                                    {c.children.length}{' '}
                                    {c.children.length === 1
                                        ? 'Kind'
                                        : 'Kinder'}
                                </div>
                            </div>

                            <span className="text-[12.5px] text-muted font-mono truncate">
                                {c.caseNumber || '—'}
                            </span>

                            <div className="flex items-center gap-1.5 min-w-0">
                                {c._fkDetails.map((u, idx) => (
                                    <div
                                        key={u.id ?? u._id}
                                        className={idx > 0 ? '-ml-1.5' : ''}
                                        title={`${u.firstName} ${u.lastName}`}
                                    >
                                        <Avatar
                                            name={`${u.firstName} ${u.lastName}`}
                                            size={22}
                                            color={pickFkColor(idx)}
                                        />
                                    </div>
                                ))}
                                {c._fkDetails.length === 0 && (
                                    <span className="text-[12px] text-muted">
                                        —
                                    </span>
                                )}
                                {c._fkDetails.length > 1 && (
                                    <span className="text-[11px] font-medium bg-accent/10 text-accent px-1.5 py-0.5 rounded ml-1">
                                        Tandem
                                    </span>
                                )}
                            </div>

                            <span className="text-[13px] text-text tabular-nums">
                                {c.weeklyHoursQuota}h
                            </span>

                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <UtilBar percent={pct} />
                                </div>
                                <span className="text-[12px] text-muted tabular-nums w-9 text-right">
                                    {pct}%
                                </span>
                            </div>

                            <StatusPill status={c.status} size="sm" />
                        </div>
                    );
                })}
            </Card>
        </div>
    );
}
