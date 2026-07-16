import { useState } from 'react';
import { Button, Icon } from '../shared';
import { api } from '../../utils/api';
import type { ClientStatus } from '../../types';

export interface ClientFormInitial {
    id: string;
    familyName?: string;
    firstName?: string;
    caseNumber?: string;
    address?: string;
    phone?: string;
    jugendamtContact?: string;
    weeklyHoursQuota?: number;
    status?: ClientStatus;
    startDate?: string;
    children?: { name: string; age: number }[];
}

interface ClientFormProps {
    mode: 'create' | 'edit';
    initial?: ClientFormInitial;
    onSuccess: () => void;
    onCancel: () => void;
    // Nur diese Felder rendern/senden (z. B. für Fachkräfte). Ohne Angabe:
    // create → alle Felder, edit → Admin-Felder.
    editableFields?: string[];
}

const CREATE_FIELDS = [
    'familyName',
    'firstName',
    'caseNumber',
    'children',
    'address',
    'phone',
    'jugendamtContact',
    'weeklyHoursQuota',
    'nextReport',
    'startDate',
    'status',
];
const ADMIN_EDIT_FIELDS = [
    'familyName',
    'caseNumber',
    'children',
    'address',
    'phone',
    'jugendamtContact',
    'weeklyHoursQuota',
    'startDate',
    'status',
];

const STATUSES: ClientStatus[] = ['aktiv', 'pausiert', 'abgeschlossen'];

const inputCls =
    'h-9 px-3 rounded-md bg-bg border border-border text-[13px] text-text outline-none focus:border-accent';
const labelCls =
    'text-[11px] font-medium text-muted uppercase tracking-[0.04em]';

interface FormState {
    familyName: string;
    firstName: string;
    caseNumber: string;
    address: string;
    phone: string;
    jugendamtContact: string;
    weeklyHoursQuota: number;
    nextReport: string;
    startDate: string;
    status: ClientStatus;
    children: { name: string; age: number }[];
}

function toDateInput(iso?: string): string {
    return iso ? iso.slice(0, 10) : '';
}

export default function ClientForm({
    mode,
    initial,
    onSuccess,
    onCancel,
    editableFields,
}: ClientFormProps) {
    const fields =
        mode === 'create'
            ? CREATE_FIELDS
            : (editableFields ?? ADMIN_EDIT_FIELDS);
    const has = (f: string) => fields.includes(f);

    const [form, setForm] = useState<FormState>({
        familyName: initial?.familyName ?? '',
        firstName: initial?.firstName ?? '',
        caseNumber: initial?.caseNumber ?? '',
        address: initial?.address ?? '',
        phone: initial?.phone ?? '',
        jugendamtContact: initial?.jugendamtContact ?? '',
        weeklyHoursQuota: initial?.weeklyHoursQuota ?? 4,
        nextReport: '',
        startDate:
            toDateInput(initial?.startDate) ||
            toDateInput(new Date().toISOString()),
        status: initial?.status ?? 'aktiv',
        children: initial?.children ?? [],
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function update<K extends keyof FormState>(key: K, val: FormState[K]) {
        setForm((f) => ({ ...f, [key]: val }));
    }

    function updateChild(
        i: number,
        patch: Partial<{ name: string; age: number }>,
    ) {
        setForm((f) => ({
            ...f,
            children: f.children.map((c, idx) =>
                idx === i ? { ...c, ...patch } : c,
            ),
        }));
    }
    function addChild() {
        setForm((f) => ({
            ...f,
            children: [...f.children, { name: '', age: 0 }],
        }));
    }
    function removeChild(i: number) {
        setForm((f) => ({
            ...f,
            children: f.children.filter((_, idx) => idx !== i),
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // Vollständiges Wertobjekt; danach auf die aktiven Felder reduzieren.
        const full: Record<string, unknown> = {
            familyName: form.familyName.trim(),
            firstName: form.firstName.trim(),
            caseNumber: form.caseNumber.trim() || undefined,
            children: form.children.filter((c) => c.name.trim() !== ''),
            address: form.address.trim() || undefined,
            phone: form.phone.trim() || undefined,
            jugendamtContact: form.jugendamtContact.trim(),
            weeklyHoursQuota: Number(form.weeklyHoursQuota),
            nextReport: form.nextReport || undefined,
            startDate: form.startDate,
            status: form.status,
        };
        const payload: Record<string, unknown> = {};
        for (const key of fields) {
            if (full[key] !== undefined) payload[key] = full[key];
        }

        try {
            setSaving(true);
            if (mode === 'create') {
                await api.post('/clients', payload);
            } else {
                await api.patch(`/clients/${initial!.id}`, payload);
            }
            onSuccess();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
                <div className="px-3 py-2 rounded-md bg-red-500/8 border border-red-500/20 text-[12.5px] text-red-600">
                    {error}
                </div>
            )}

            <div
                className="grid gap-3 grid-cols-1 sm:grid-cols-2"
            >
                {has('familyName') && (
                    <label className="flex flex-col gap-1">
                        <span className={labelCls}>Nachname (Familie)</span>
                        <input
                            required
                            value={form.familyName}
                            onChange={(e) =>
                                update('familyName', e.target.value)
                            }
                            className={inputCls}
                        />
                    </label>
                )}
                {has('firstName') && (
                    <label className="flex flex-col gap-1">
                        <span className={labelCls}>Vorname</span>
                        <input
                            required
                            value={form.firstName}
                            onChange={(e) =>
                                update('firstName', e.target.value)
                            }
                            className={inputCls}
                        />
                    </label>
                )}
            </div>

            {has('caseNumber') && (
                <label className="flex flex-col gap-1">
                    <span className={labelCls}>Aktenzeichen</span>
                    <input
                        value={form.caseNumber}
                        onChange={(e) => update('caseNumber', e.target.value)}
                        className={inputCls}
                    />
                </label>
            )}

            {has('address') && (
                <label className="flex flex-col gap-1">
                    <span className={labelCls}>Adresse</span>
                    <input
                        value={form.address}
                        onChange={(e) => update('address', e.target.value)}
                        className={inputCls}
                    />
                </label>
            )}

            <div
                className="grid gap-3 grid-cols-1 sm:grid-cols-2"
            >
                {has('phone') && (
                    <label className="flex flex-col gap-1">
                        <span className={labelCls}>Telefon</span>
                        <input
                            value={form.phone}
                            onChange={(e) => update('phone', e.target.value)}
                            className={inputCls}
                        />
                    </label>
                )}
                {has('jugendamtContact') && (
                    <label className="flex flex-col gap-1">
                        <span className={labelCls}>Jugendamt-Kontakt</span>
                        <input
                            required
                            value={form.jugendamtContact}
                            onChange={(e) =>
                                update('jugendamtContact', e.target.value)
                            }
                            className={inputCls}
                        />
                    </label>
                )}
            </div>

            {has('children') && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className={labelCls}>Kinder</span>
                        <button
                            type="button"
                            onClick={addChild}
                            className="text-[11px] text-accent hover:underline cursor-pointer"
                        >
                            + Kind
                        </button>
                    </div>
                    {form.children.map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                placeholder="Name"
                                value={c.name}
                                onChange={(e) =>
                                    updateChild(i, { name: e.target.value })
                                }
                                className={`${inputCls} flex-1`}
                            />
                            <input
                                type="number"
                                min={0}
                                max={99}
                                placeholder="Alter"
                                value={c.age}
                                onChange={(e) =>
                                    updateChild(i, {
                                        age: Number(e.target.value),
                                    })
                                }
                                className={`${inputCls} w-20`}
                            />
                            <button
                                type="button"
                                onClick={() => removeChild(i)}
                                title="Entfernen"
                                className="text-muted p-1.5 rounded-md hover:bg-surface-hover hover:text-red-600 cursor-pointer"
                            >
                                <Icon name="trash" size={14} stroke={1.75} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div
                className="grid gap-3 grid-cols-1 sm:grid-cols-2"
            >
                {has('weeklyHoursQuota') && (
                    <label className="flex flex-col gap-1">
                        <span className={labelCls}>Wochen-Quote (h)</span>
                        <input
                            type="number"
                            min={0}
                            max={40}
                            step={0.5}
                            value={form.weeklyHoursQuota}
                            onChange={(e) =>
                                update(
                                    'weeklyHoursQuota',
                                    Number(e.target.value),
                                )
                            }
                            className={inputCls}
                        />
                    </label>
                )}
                {has('status') && (
                    <label className="flex flex-col gap-1">
                        <span className={labelCls}>Status</span>
                        <select
                            value={form.status}
                            onChange={(e) =>
                                update('status', e.target.value as ClientStatus)
                            }
                            className={inputCls}
                        >
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div
                className="grid gap-3 grid-cols-1 sm:grid-cols-2"
            >
                {has('startDate') && (
                    <label className="flex flex-col gap-1">
                        <span className={labelCls}>Hilfebeginn</span>
                        <input
                            type="date"
                            required
                            value={form.startDate}
                            onChange={(e) =>
                                update('startDate', e.target.value)
                            }
                            className={inputCls}
                        />
                    </label>
                )}
                {has('nextReport') && (
                    <label className="flex flex-col gap-1">
                        <span className={labelCls}>Nächster Bericht</span>
                        <input
                            type="date"
                            required
                            value={form.nextReport}
                            onChange={(e) =>
                                update('nextReport', e.target.value)
                            }
                            className={inputCls}
                        />
                    </label>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onCancel}
                    type="button"
                >
                    Abbrechen
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={saving}
                >
                    {saving
                        ? 'Speichere…'
                        : mode === 'create'
                          ? 'Anlegen'
                          : 'Speichern'}
                </Button>
            </div>
        </form>
    );
}
