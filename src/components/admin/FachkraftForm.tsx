import { useState } from 'react';
import { Button } from '../shared';
import { api } from '../../utils/api';
import type { Fachkraft } from '../../types';

interface FachkraftFormProps {
    mode: 'create' | 'edit';
    initial?: Fachkraft;
    onSuccess: () => void;
    onCancel: () => void;
}

interface FormState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    maxClients: number;
    weeklyTargetHours: number;
    vacationDaysPerYear: number;
}

function fromInitial(fk?: Fachkraft): FormState {
    return {
        firstName: fk?.firstName ?? '',
        lastName: fk?.lastName ?? '',
        email: fk?.email ?? '',
        password: '',
        maxClients: fk?.maxClients ?? 6,
        weeklyTargetHours: fk?.weeklyTargetMinutes
            ? fk.weeklyTargetMinutes / 60
            : 40,
        vacationDaysPerYear: fk?.vacationDaysPerYear ?? 30,
    };
}

export default function FachkraftForm({
    mode,
    initial,
    onSuccess,
    onCancel,
}: FachkraftFormProps) {
    const [form, setForm] = useState<FormState>(fromInitial(initial));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function update<K extends keyof FormState>(key: K, val: FormState[K]) {
        setForm((f) => ({ ...f, [key]: val }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (mode === 'create' && form.password.length < 8) {
            setError('Passwort muss mindestens 8 Zeichen haben');
            return;
        }
        if (mode === 'edit' && form.password.length > 0 && form.password.length < 8) {
            setError('Passwort muss mindestens 8 Zeichen haben');
            return;
        }

        try {
            setSaving(true);
            const payload: Record<string, unknown> = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim().toLowerCase(),
                maxClients: Number(form.maxClients),
                weeklyTargetMinutes: Math.round(form.weeklyTargetHours * 60),
                vacationDaysPerYear: Number(form.vacationDaysPerYear),
            };
            if (mode === 'create') {
                payload.password = form.password;
                payload.role = 'fachkraft';
                await api.post('/users', payload);
            } else {
                if (form.password.length > 0) payload.password = form.password;
                await api.patch(`/users/${initial!.id}`, payload);
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

            <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted uppercase tracking-[0.04em]">
                        Vorname
                    </span>
                    <input
                        required
                        value={form.firstName}
                        onChange={(e) => update('firstName', e.target.value)}
                        className="h-9 px-3 rounded-md bg-bg border border-border text-[13px] text-text outline-none focus:border-accent"
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted uppercase tracking-[0.04em]">
                        Nachname
                    </span>
                    <input
                        required
                        value={form.lastName}
                        onChange={(e) => update('lastName', e.target.value)}
                        className="h-9 px-3 rounded-md bg-bg border border-border text-[13px] text-text outline-none focus:border-accent"
                    />
                </label>
            </div>

            <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted uppercase tracking-[0.04em]">
                    E-Mail
                </span>
                <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="h-9 px-3 rounded-md bg-bg border border-border text-[13px] text-text outline-none focus:border-accent"
                />
            </label>

            <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-muted uppercase tracking-[0.04em]">
                    {mode === 'create'
                        ? 'Passwort (min. 8 Zeichen)'
                        : 'Neues Passwort (leer lassen = unverändert)'}
                </span>
                <input
                    type="password"
                    required={mode === 'create'}
                    minLength={mode === 'create' ? 8 : undefined}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    className="h-9 px-3 rounded-md bg-bg border border-border text-[13px] text-text outline-none focus:border-accent"
                />
            </label>

            <div
                className="grid gap-3"
                style={{ gridTemplateColumns: '1fr 1fr 1fr' }}
            >
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted uppercase tracking-[0.04em]">
                        Max. Klienten
                    </span>
                    <input
                        type="number"
                        min={0}
                        max={50}
                        value={form.maxClients}
                        onChange={(e) =>
                            update('maxClients', Number(e.target.value))
                        }
                        className="h-9 px-3 rounded-md bg-bg border border-border text-[13px] text-text outline-none focus:border-accent"
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted uppercase tracking-[0.04em]">
                        Wochen-Soll (h)
                    </span>
                    <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={form.weeklyTargetHours}
                        onChange={(e) =>
                            update('weeklyTargetHours', Number(e.target.value))
                        }
                        className="h-9 px-3 rounded-md bg-bg border border-border text-[13px] text-text outline-none focus:border-accent"
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted uppercase tracking-[0.04em]">
                        Urlaubstage / Jahr
                    </span>
                    <input
                        type="number"
                        min={0}
                        max={60}
                        value={form.vacationDaysPerYear}
                        onChange={(e) =>
                            update(
                                'vacationDaysPerYear',
                                Number(e.target.value),
                            )
                        }
                        className="h-9 px-3 rounded-md bg-bg border border-border text-[13px] text-text outline-none focus:border-accent"
                    />
                </label>
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
