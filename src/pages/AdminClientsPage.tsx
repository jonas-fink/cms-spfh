import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    Avatar,
    Button,
    Card,
    Icon,
    Modal,
    SectionHeader,
    StatusPill,
    UtilBar,
    FilterBtn,
} from '../components/shared';
import { ClientForm } from '../components/client';
import type { ClientFormInitial } from '../components/client/ClientForm';
import { api } from '../utils/api';
import { pickFkColor } from '../utils/colors';
import type {
    ApiClient,
    ApiClientHours,
    Client,
    ClientStatus,
    PopulatedUser,
} from '../types';

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
    const [reloadKey, setReloadKey] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ClientFormInitial | null>(null);

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
                    firstName: c.firstName,
                    caseNumber: c.caseNumber,
                    address: c.address,
                    phone: c.phone,
                    jugendamtContact: c.jugendamtContact,
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
    }, [reloadKey]);

    function openCreate() {
        setEditing(null);
        setModalOpen(true);
    }
    function openEdit(c: (typeof clients)[number]) {
        setEditing({
            id: c.id,
            familyName: c.familyName,
            firstName: c.firstName,
            caseNumber: c.caseNumber,
            address: c.address,
            phone: c.phone,
            jugendamtContact: c.jugendamtContact,
            weeklyHoursQuota: c.weeklyHoursQuota,
            status: c.status,
            startDate: c.startDate,
            children: c.children,
        });
        setModalOpen(true);
    }
    async function handleArchive(c: (typeof clients)[number]) {
        if (
            !confirm(
                `Familie ${c.familyName} archivieren? Der Klient wird auf „abgeschlossen“ gesetzt (Verlauf bleibt erhalten).`,
            )
        )
            return;
        try {
            await api.patch(`/clients/${c.id}`, { status: 'abgeschlossen' });
            setReloadKey((k) => k + 1);
        } catch (err) {
            alert((err as Error).message);
        }
    }
    function handleSuccess() {
        setModalOpen(false);
        setEditing(null);
        setReloadKey((k) => k + 1);
    }

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

    const COLS = '2fr 1fr 1.4fr 80px 1.2fr 100px 80px';

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
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
                <Button
                    variant="primary"
                    size="sm"
                    icon="plus"
                    onClick={openCreate}
                >
                    Neuer Klient
                </Button>
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
                    className="h-8 px-3 rounded-md bg-bg border border-border text-[12.5px] text-text outline-none focus:border-accent md:w-70 w-full"
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
                <div className="overflow-x-auto">
                    <div className="min-w-215">
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
                                    '',
                                ] as const
                            ).map((h, hi) => (
                                <span
                                    key={hi}
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
                            const pct = utilPercent(
                                c.minutesThisWeek,
                                quotaMinutes,
                            );
                            return (
                                <div
                                    key={c.id}
                                    onClick={() =>
                                        navigate(`/admin/clients/${c.id}`)
                                    }
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
                                                className={
                                                    idx > 0 ? '-ml-1.5' : ''
                                                }
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

                                    <div className="flex gap-0.5 justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEdit(c);
                                            }}
                                            className="bg-transparent border-none cursor-pointer text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors duration-100"
                                            title="Bearbeiten"
                                        >
                                            <Icon
                                                name="edit"
                                                size={14}
                                                stroke={1.75}
                                            />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleArchive(c);
                                            }}
                                            className="bg-transparent border-none cursor-pointer text-muted p-1.5 rounded-md hover:bg-surface-hover hover:text-red-600 transition-colors duration-100"
                                            title="Archivieren"
                                        >
                                            <Icon
                                                name="trash"
                                                size={14}
                                                stroke={1.75}
                                            />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={
                    editing
                        ? `Familie ${editing.familyName} bearbeiten`
                        : 'Neuer Klient'
                }
            >
                <ClientForm
                    mode={editing ? 'edit' : 'create'}
                    initial={editing ?? undefined}
                    onSuccess={handleSuccess}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
