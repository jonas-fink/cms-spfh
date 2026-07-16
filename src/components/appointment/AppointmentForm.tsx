import { useState, type FormEvent } from 'react';
import { Button } from '../shared';
import { api } from '../../utils/api';
import type {
    Appointment,
    AppointmentStatus,
    PopulatedUser,
} from '../../types';
import { useAuth } from '../../context/AuthContext';

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

const STATUSES: AppointmentStatus[] = [
    'geplant',
    'durchgeführt',
    'ausgefallen',
];

const MINUTES: Array<0 | 15 | 30 | 45> = [0, 15, 30, 45];

interface AppointmentFormProps {
    clientId: string;
    mode: 'create' | 'edit';
    appointment?: Appointment;
    onSuccess: () => void | Promise<void>;
    onCancel: () => void;
    assignedFachkraefte?: PopulatedUser[];
    initialParticipants?: string[];
    initialDate?: Date;
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
    assignedFachkraefte = [],
    initialParticipants,
    initialDate,
}: AppointmentFormProps) {
    const { user } = useAuth();
    const [type, setType] = useState<FormType>(
        (appointment?.type as FormType) ?? 'Hausbesuch',
    );
    const [status, setStatus] = useState<AppointmentStatus>(
        appointment?.status ?? 'geplant',
    );
    const [date, setDate] = useState<string>(
        appointment
            ? toLocalInputValue(appointment.date)
            : toLocalInputValue((initialDate ?? new Date()).toISOString()),
    );
    const [durationHours, setDurationHours] = useState<number>(
        appointment?.durationHours ?? 1,
    );
    const [durationMinutes, setDurationMinutes] = useState<0 | 15 | 30 | 45>(
        appointment?.durationMinutes ?? 0,
    );
    const [report, setReport] = useState<string>(appointment?.report ?? '');
    const [participantIds, setParticipantIds] = useState<string[]>(
        () => initialParticipants ?? [],
    );
    const [submitting, setSubmitting] = useState(false);

    function toggleParticipant(id: string) {
        setParticipantIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    // Auswählbare Teilnehmer = zugewiesene FKs ohne die aktuelle FK (Ersteller)
    const selectableFks = assignedFachkraefte.filter(
        (fk) => fk._id !== user?.id,
    );
    const allSelected =
        selectableFks.length > 0 &&
        selectableFks.every((fk) => participantIds.includes(fk._id));
    function toggleAllParticipants() {
        setParticipantIds(allSelected ? [] : selectableFks.map((fk) => fk._id));
    }

    function handleStatusChange(next: AppointmentStatus) {
        setStatus(next);
        // Ausgefallene Termine werden pauschal mit 90 Min. angesetzt.
        if (next === 'ausgefallen') {
            setDurationHours(1);
            setDurationMinutes(30);
        }
    }
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const body: Record<string, unknown> = {
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
            // Teilnehmer nur senden, wenn der Selector angezeigt wird –
            // sonst würde ein Status-Edit die Tandem-Teilnehmer löschen.
            if (assignedFachkraefte.length > 0) {
                body.participants = participantIds;
            }

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                            handleStatusChange(
                                e.target.value as AppointmentStatus,
                            )
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

            {assignedFachkraefte.length > 0 && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11.5px] text-muted font-medium">
                            Tandem-Teilnehmer (optional)
                        </span>
                        {selectableFks.length > 0 && (
                            <button
                                type="button"
                                onClick={toggleAllParticipants}
                                className="text-[11px] text-accent hover:underline cursor-pointer"
                            >
                                {allSelected ? 'Keine' : 'Alle auswählen'}
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {selectableFks.map((fk) => {
                            const active = participantIds.includes(fk._id);
                            return (
                                <button
                                    key={fk._id}
                                    type="button"
                                    onClick={() => toggleParticipant(fk._id)}
                                    className={`px-2 py-1 rounded-md border text-[11.5px] cursor-pointer transition-colors ${
                                        active
                                            ? 'bg-accent text-white border-accent'
                                            : 'bg-surface text-muted border-border hover:border-border-strong'
                                    }`}
                                >
                                    {fk.firstName} {fk.lastName}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {error && <p className="text-[12.5px] text-red-600 m-0">{error}</p>}

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
