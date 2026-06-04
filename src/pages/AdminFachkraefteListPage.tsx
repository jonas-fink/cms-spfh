import { useEffect, useState } from 'react';
import {
    Avatar,
    Button,
    Card,
    Icon,
    Modal,
    SectionHeader,
} from '../components/shared';
import { FachkraftForm } from '../components/admin';
import { FK_COLORS } from '../utils/colors';
import { api } from '../utils/api';
import type { Fachkraft } from '../types';

interface ApiUser {
    _id: string;
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'fachkraft' | 'admin';
    maxClients?: number;
    weeklyTargetMinutes?: number;
    vacationDaysPerYear?: number;
    overtimeMinutes?: number;
}

interface ApiWorkloadEntry {
    fachkraft: { id: string; name: string; email: string };
    clientCount: number;
    maxClients: number;
}

interface EnrichedFK extends Fachkraft {
    clientCount: number;
}

export default function AdminFachkraefteListPage() {
    const [fks, setFks] = useState<EnrichedFK[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Fachkraft | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);
                const [users, workload] = await Promise.all([
                    api.get<ApiUser[]>('/users'),
                    api.get<ApiWorkloadEntry[]>('/stats/workload'),
                ]);
                if (cancelled) return;

                const clientCountById = new Map<string, number>();
                for (const w of workload) {
                    clientCountById.set(w.fachkraft.id, w.clientCount);
                }

                const mapped: EnrichedFK[] = users.map((u) => ({
                    id: u.id ?? u._id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.email,
                    role: u.role,
                    maxClients: u.maxClients,
                    weeklyTargetMinutes: u.weeklyTargetMinutes,
                    vacationDaysPerYear: u.vacationDaysPerYear,
                    overtimeMinutes: u.overtimeMinutes,
                    clientCount: clientCountById.get(u.id ?? u._id) ?? 0,
                }));
                setFks(mapped);
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

    function openEdit(fk: Fachkraft) {
        setEditing(fk);
        setModalOpen(true);
    }

    async function handleDelete(fk: EnrichedFK) {
        if (fk.clientCount > 0) {
            alert(
                `${fk.firstName} ${fk.lastName} ist noch ${fk.clientCount} Klient${fk.clientCount === 1 ? '' : 'en'} zugewiesen. Bitte zuerst neu verteilen.`,
            );
            return;
        }
        if (!confirm(`Fachkraft ${fk.firstName} ${fk.lastName} wirklich löschen?`))
            return;
        try {
            await api.delete(`/users/${fk.id}`);
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
                Lade Fachkräfte…
            </div>
        );
    }

    const COLS = '2fr 2fr 1fr 1fr 1fr 110px';

    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-[24px] font-semibold text-text tracking-[-0.02em]">
                        Fachkräfte
                    </h1>
                    <p className="text-[13px] text-muted mt-0.5">
                        {fks.length} aktiv
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    icon="plus"
                    onClick={openCreate}
                >
                    Neue Fachkraft
                </Button>
            </div>

            <Card>
                <div className="px-4 py-3 border-b border-border">
                    <SectionHeader
                        title="Alle Fachkräfte"
                        sub="Stammdaten und Caseload"
                    />
                </div>

                <div
                    className="grid gap-4 px-4 py-2.5 border-b border-border"
                    style={{ gridTemplateColumns: COLS }}
                >
                    {(
                        [
                            'Name',
                            'E-Mail',
                            'Klienten',
                            'Soll/Woche',
                            'Urlaub',
                            '',
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

                {fks.length === 0 && (
                    <div className="px-4 py-10 text-center text-[13px] text-muted">
                        Noch keine Fachkräfte angelegt.
                    </div>
                )}

                {fks.map((fk, i) => {
                    const targetH = fk.weeklyTargetMinutes
                        ? Math.round((fk.weeklyTargetMinutes / 60) * 10) / 10
                        : null;
                    return (
                        <div
                            key={fk.id}
                            className={[
                                'grid gap-4 px-4 py-3 items-center',
                                i < fks.length - 1
                                    ? 'border-b border-border'
                                    : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            style={{ gridTemplateColumns: COLS }}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar
                                    name={`${fk.firstName} ${fk.lastName}`}
                                    size={28}
                                    color={FK_COLORS[i % FK_COLORS.length]}
                                />
                                <span className="text-[13px] font-medium text-text truncate">
                                    {fk.firstName} {fk.lastName}
                                </span>
                            </div>
                            <span className="text-[12.5px] text-muted truncate">
                                {fk.email}
                            </span>
                            <span className="text-[13px] text-text tabular-nums">
                                {fk.clientCount}
                                <span className="text-muted">
                                    /{fk.maxClients ?? '—'}
                                </span>
                            </span>
                            <span className="text-[13px] text-text tabular-nums">
                                {targetH !== null ? `${targetH}h` : '—'}
                            </span>
                            <span className="text-[13px] text-text tabular-nums">
                                {fk.vacationDaysPerYear ?? '—'}
                                {fk.vacationDaysPerYear !== undefined
                                    ? ' Tage'
                                    : ''}
                            </span>
                            <div className="flex gap-0.5 justify-end">
                                <button
                                    onClick={() => openEdit(fk)}
                                    className="bg-transparent border-none cursor-pointer text-muted p-1.5 rounded-md hover:bg-surface-hover transition-colors duration-100"
                                    title="Bearbeiten"
                                >
                                    <Icon name="edit" size={14} stroke={1.75} />
                                </button>
                                <button
                                    onClick={() => handleDelete(fk)}
                                    className="bg-transparent border-none cursor-pointer text-muted p-1.5 rounded-md hover:bg-surface-hover hover:text-red-600 transition-colors duration-100"
                                    title="Löschen"
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
            </Card>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={
                    editing
                        ? `${editing.firstName} ${editing.lastName} bearbeiten`
                        : 'Neue Fachkraft'
                }
            >
                <FachkraftForm
                    mode={editing ? 'edit' : 'create'}
                    initial={editing ?? undefined}
                    onSuccess={handleSuccess}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
