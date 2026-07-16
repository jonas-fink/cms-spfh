import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, SectionHeader, Icon } from '../shared';
import { api } from '../../utils/api';
import { pickFkColor } from '../../utils/colors';
import type { Client, ClientStatus, Fachkraft } from '../../types';

interface ApiFachkraft {
    _id: string;
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'fachkraft' | 'admin';
}

interface AdminClientEditProps {
    client: Client;
    onChange: () => void | Promise<void>;
}

const STATUSES: ClientStatus[] = ['aktiv', 'pausiert', 'abgeschlossen'];

export default function AdminClientEdit({
    client,
    onChange,
}: AdminClientEditProps) {
    const [quota, setQuota] = useState<number>(client.weeklyHoursQuota);
    const [status, setStatus] = useState<ClientStatus>(client.status);
    const [fachkraefte, setFachkraefte] = useState<Fachkraft[]>([]);
    const [addFkId, setAddFkId] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    useEffect(() => {
        setQuota(client.weeklyHoursQuota);
        setStatus(client.status);
    }, [client.weeklyHoursQuota, client.status]);

    useEffect(() => {
        let cancelled = false;
        api.get<ApiFachkraft[]>('/users')
            .then((users) => {
                if (cancelled) return;
                setFachkraefte(
                    users.map((u) => ({
                        id: u.id ?? u._id,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        email: u.email,
                        role: u.role,
                    })),
                );
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const assignedFkDetails = useMemo(
        () =>
            client.assignedFachkraefte
                .map((fkId, i) => {
                    const fk = fachkraefte.find((f) => f.id === fkId);
                    return fk
                        ? { ...fk, color: pickFkColor(i) }
                        : { id: fkId, firstName: '?', lastName: '', email: '', color: pickFkColor(i) };
                }),
        [client.assignedFachkraefte, fachkraefte],
    );

    const availableFks = fachkraefte.filter(
        (f) => !client.assignedFachkraefte.includes(f.id),
    );

    const dirty =
        quota !== client.weeklyHoursQuota || status !== client.status;

    async function handleSaveCore() {
        try {
            setSaving(true);
            setError(null);
            setInfo(null);
            await api.patch(`/clients/${client.id}`, {
                weeklyHoursQuota: quota,
                status,
            });
            setInfo('Änderungen gespeichert');
            await onChange();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function handleAssign() {
        if (!addFkId) return;
        try {
            setAssigning(true);
            setError(null);
            setInfo(null);
            await api.post(`/clients/${client.id}/assign`, {
                fachkraftId: addFkId,
            });
            setAddFkId('');
            await onChange();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setAssigning(false);
        }
    }

    async function handleUnassign(fkId: string) {
        if (!confirm('Fachkraft wirklich entfernen?')) return;
        try {
            setError(null);
            setInfo(null);
            await api.delete(`/clients/${client.id}/assign/${fkId}`);
            await onChange();
        } catch (err) {
            setError((err as Error).message);
        }
    }

    return (
        <div className="flex flex-col gap-4 max-w-[760px]">
            {error && (
                <div className="px-4 py-2.5 rounded-md bg-red-500/8 border border-red-500/20 text-[12.5px] text-red-600">
                    {error}
                </div>
            )}
            {info && (
                <div className="px-4 py-2.5 rounded-md bg-emerald-500/8 border border-emerald-500/20 text-[12.5px] text-emerald-700">
                    {info}
                </div>
            )}

            {/* Quote + Status */}
            <Card>
                <div className="px-5 py-3 border-b border-border">
                    <SectionHeader
                        title="Stammdaten"
                        sub="Wochenquote und Status"
                    />
                </div>
                <div className="p-5 grid gap-4 grid-cols-1 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium text-muted uppercase tracking-[0.04em]">
                            Wochenquote (Stunden)
                        </span>
                        <input
                            type="number"
                            min={0}
                            max={60}
                            step={0.5}
                            value={quota}
                            onChange={(e) => setQuota(Number(e.target.value))}
                            className="h-9 px-3 rounded-md bg-bg border border-border text-[13px] text-text outline-none focus:border-accent"
                        />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium text-muted uppercase tracking-[0.04em]">
                            Status
                        </span>
                        <select
                            value={status}
                            onChange={(e) =>
                                setStatus(e.target.value as ClientStatus)
                            }
                            className="h-9 px-3 rounded-md bg-bg border border-border text-[13px] text-text outline-none focus:border-accent"
                        >
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="px-5 pb-4 flex justify-end">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveCore}
                        disabled={!dirty || saving}
                    >
                        {saving ? 'Speichere…' : 'Speichern'}
                    </Button>
                </div>
            </Card>

            {/* Zuweisungen */}
            <Card>
                <div className="px-5 py-3 border-b border-border">
                    <SectionHeader
                        title="Zugewiesene Fachkräfte"
                        sub={
                            client.assignedFachkraefte.length > 1
                                ? 'Tandem-Betreuung'
                                : 'Einzel-Betreuung'
                        }
                    />
                </div>
                <div className="p-5 flex flex-col gap-2">
                    {assignedFkDetails.length === 0 && (
                        <p className="text-[12.5px] text-muted">
                            Keine Fachkraft zugewiesen.
                        </p>
                    )}
                    {assignedFkDetails.map((fk) => (
                        <div
                            key={fk.id}
                            className="flex items-center gap-3 px-3 py-2 rounded-md bg-bg border border-border"
                        >
                            <Avatar
                                name={`${fk.firstName} ${fk.lastName}`}
                                size={28}
                                color={fk.color}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium text-text">
                                    {fk.firstName} {fk.lastName}
                                </div>
                                <div className="text-[11.5px] text-muted">
                                    {fk.email}
                                </div>
                            </div>
                            <button
                                onClick={() => handleUnassign(fk.id)}
                                className="text-muted hover:text-red-600 p-1 rounded-md transition-colors"
                                title="Entfernen"
                            >
                                <Icon name="trash" size={14} stroke={1.75} />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="px-5 pb-4 flex items-center gap-2 border-t border-border pt-4">
                    <select
                        value={addFkId}
                        onChange={(e) => setAddFkId(e.target.value)}
                        className="flex-1 h-9 px-3 rounded-md bg-bg border border-border text-[13px] text-text outline-none focus:border-accent"
                    >
                        <option value="">Fachkraft hinzufügen…</option>
                        {availableFks.map((fk) => (
                            <option key={fk.id} value={fk.id}>
                                {fk.firstName} {fk.lastName} ({fk.email})
                            </option>
                        ))}
                    </select>
                    <Button
                        variant="primary"
                        size="sm"
                        icon="plus"
                        onClick={handleAssign}
                        disabled={!addFkId || assigning}
                    >
                        {assigning ? 'Weise zu…' : 'Zuweisen'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
