import { useState, type FormEvent } from 'react';
import { Button } from '../shared';
import { api } from '../../utils/api';
import type { Appointment, AppointmentStatus } from '../../types';

type FormType =
    | 'Hausbesuch'
    | 'Krisenintervention'
    | 'Telefongespräch'
    | 'Beratung'
    | 'Sonstiges';

const TYPES: FormType[] = [
    'Hausbesuch',
    'Krisenintervention',
    'Telefongespräch',
    'Beratung',
    'Sonstiges',
];

const STATUSES: AppointmentStatus[] = ['geplant', 'durchgeführt', 'ausgefallen'];

const MINUTES: Array<0 | 15 | 30 | 45> = [0, 15, 30, 45];

interface AppointmentFormProps {
    clientId: string;
    mode: 'create' | 'edit';
    appointment?: Appointment;
    onSuccess: () => void | Promise<void>;
    onCancel: () => void;
}

function toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60_000);
    return local.toISOString().slice(0, 16);
}

export default function AppointmentForm({
    clientId,
    mode,
    appointment,
    onSuccess,
    onCancel,
}: AppointmentFormProps) {
    const [type, setType] = useState<FormType>(
        (appointment?.type as FormType) ?? 'Hausbesuch',
    );
    const [status, setStatus] = useState<AppointmentStatus>(
        appointment?.status ?? 'geplant',
    );
    const [date, setDate] = useState<string>(
        appointment
            ? toLocalInputValue(appointment.date)
            : toLocalInputValue(new Date().toISOString()),
    );
    const [durationHours, setDurationHours] = useState<number>(
        appointment?.durationHours ?? 1,
    );
    const [durationMinutes, setDurationMinutes] = useState<0 | 15 | 30 | 45>(
        appointment?.durationMinutes ?? 0,
    );
    const [report, setReport] = useState<string>(appointment?.report ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const body = {
                type,
                status,
                date: new Date(date).toISOString(),
                durationHours,
                durationMinutes,
                report:
                    status === 'durchgeführt' && report.trim() === ''
                        ? '-'
                        : report || '-',
            };

            if (mode === 'create') {
                await api.post(`/clients/${clientId}/appointments`, {
                    ...body,
                    clientId,
                });
            } else if (appointment) {
                await api.patch(
                    `/clients/${clientId}/appointments/${appointment.id}`,
                    body,
                );
            }
            await onSuccess();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3.5">
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Typ
                    </span>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value as FormType)}
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text focus:outline-none focus:border-border-strong"
                    >
                        {TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Status
                    </span>
                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value as AppointmentStatus)
                        }
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text focus:outline-none focus:border-border-strong"
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-muted font-medium">
                    Datum & Uhrzeit
                </span>
                <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text focus:outline-none focus:border-border-strong"
                />
            </label>

            <div className="grid grid-cols-2 gap-3.5">
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Stunden
                    </span>
                    <input
                        type="number"
                        min={0}
                        max={12}
                        value={durationHours}
                        onChange={(e) =>
                            setDurationHours(parseInt(e.target.value) || 0)
                        }
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text tabular-nums focus:outline-none focus:border-border-strong"
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Minuten
                    </span>
                    <select
                        value={durationMinutes}
                        onChange={(e) =>
                            setDurationMinutes(
                                parseInt(e.target.value) as 0 | 15 | 30 | 45,
                            )
                        }
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text focus:outline-none focus:border-border-strong"
                    >
                        {MINUTES.map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-muted font-medium">
                    Bericht
                </span>
                <textarea
                    value={report === '-' ? '' : report}
                    onChange={(e) => setReport(e.target.value)}
                    rows={4}
                    placeholder={
                        status === 'durchgeführt'
                            ? 'Bericht zum Termin (leer = ausstehend)'
                            : 'Optional'
                    }
                    className="px-2.5 py-2 rounded-md bg-bg border border-border text-[13px] text-text leading-relaxed focus:outline-none focus:border-border-strong resize-y"
                />
            </label>

            {error && (
                <p className="text-[12.5px] text-red-600 m-0">{error}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Abbrechen
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={submitting}
                >
                    {submitting
                        ? 'Speichert…'
                        : mode === 'create'
                          ? 'Termin anlegen'
                          : 'Speichern'}
                </Button>
            </div>
        </form>
    );
}
