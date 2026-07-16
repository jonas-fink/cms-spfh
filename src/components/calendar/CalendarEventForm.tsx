import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../shared';
import { api } from '../../utils/api';
import type {
    ApiCalendarEvent,
    CalendarEventType,
    CalendarEventVisibility,
    Fachkraft,
} from '../../types';

const TYPES: { value: CalendarEventType; label: string }[] = [
    { value: 'team_meeting', label: 'Team-Meeting' },
    { value: 'koordination', label: 'Koordination' },
    { value: 'sonstiges', label: 'Sonstiges' },
];

function toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60_000);
    return local.toISOString().slice(0, 16);
}

interface Props {
    mode: 'create' | 'edit';
    event?: ApiCalendarEvent;
    initialDate?: Date;
    onSuccess: () => void | Promise<void>;
    onCancel: () => void;
    currentUserId: string;
}

export default function CalendarEventForm({
    mode,
    event,
    initialDate,
    onSuccess,
    onCancel,
    currentUserId,
}: Props) {
    const [users, setUsers] = useState<Fachkraft[]>([]);
    const [title, setTitle] = useState(event?.title ?? '');
    const [description, setDescription] = useState(event?.description ?? '');
    const [type, setType] = useState<CalendarEventType>(
        event?.type ?? 'team_meeting',
    );
    const [date, setDate] = useState(
        toLocalInputValue(
            event?.date ?? (initialDate ?? new Date()).toISOString(),
        ),
    );
    const [endDate, setEndDate] = useState(
        event?.endDate ? toLocalInputValue(event.endDate) : '',
    );
    const [visibility, setVisibility] = useState<CalendarEventVisibility>(
        event?.visibility ?? 'team',
    );
    const [participantIds, setParticipantIds] = useState<string[]>(() => {
        if (!event) return [];
        return event.participants
            .map((p) =>
                typeof p.userId === 'object' ? p.userId._id : p.userId,
            )
            .filter((id) => id !== currentUserId);
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<Fachkraft[]>('/users')
            .then(setUsers)
            .catch(() => setUsers([]));
    }, []);

    function toggleParticipant(id: string) {
        setParticipantIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        if (!title.trim()) {
            setError('Titel erforderlich');
            return;
        }
        setSubmitting(true);
        try {
            const body: Record<string, unknown> = {
                title: title.trim(),
                description: description.trim() || undefined,
                type,
                date: new Date(date).toISOString(),
                endDate: endDate ? new Date(endDate).toISOString() : undefined,
                visibility,
                participants: [currentUserId, ...participantIds],
            };
            if (mode === 'create') {
                await api.post('/calendar-events', body);
            } else if (event) {
                await api.patch(`/calendar-events/${event._id}`, body);
            }
            await onSuccess();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    const otherUsers = users.filter((u) => u.id !== currentUserId);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-muted font-medium">
                    Titel
                </span>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={200}
                    className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text focus:outline-none focus:border-border-strong"
                />
            </label>

            <div className="grid grid-cols-2 gap-3.5">
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Typ
                    </span>
                    <select
                        value={type}
                        onChange={(e) =>
                            setType(e.target.value as CalendarEventType)
                        }
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text focus:outline-none focus:border-border-strong"
                    >
                        {TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Sichtbarkeit
                    </span>
                    <select
                        value={visibility}
                        onChange={(e) =>
                            setVisibility(
                                e.target.value as CalendarEventVisibility,
                            )
                        }
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text focus:outline-none focus:border-border-strong"
                    >
                        <option value="team">Team</option>
                        <option value="private">Privat</option>
                    </select>
                </label>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Beginn
                    </span>
                    <input
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text focus:outline-none focus:border-border-strong"
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Ende (optional)
                    </span>
                    <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text focus:outline-none focus:border-border-strong"
                    />
                </label>
            </div>

            <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-muted font-medium">
                    Beschreibung
                </span>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={2000}
                    className="px-2.5 py-2 rounded-md bg-bg border border-border text-[13px] text-text leading-relaxed focus:outline-none focus:border-border-strong resize-y"
                />
            </label>

            <div className="flex flex-col gap-1.5">
                <span className="text-[11.5px] text-muted font-medium">
                    Teilnehmer ({participantIds.length + 1} inkl. dir)
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto border border-border rounded-md p-2 bg-bg">
                    {otherUsers.length === 0 && (
                        <span className="text-[12px] text-muted">
                            Keine weiteren Nutzer verfügbar
                        </span>
                    )}
                    {otherUsers.length > 0 && (
                        <button
                            type="button"
                            onClick={() =>
                                setParticipantIds((prev) =>
                                    prev.length === otherUsers.length
                                        ? []
                                        : otherUsers.map((u) => u.id),
                                )
                            }
                            className={`px-2 py-1 rounded-md border text-[11.5px] cursor-pointer transition-colors ${
                                participantIds.length === otherUsers.length
                                    ? 'bg-accent text-white border-accent'
                                    : 'bg-surface text-muted border-border hover:border-border-strong'
                            }`}
                        >
                            Alle
                        </button>
                    )}
                    {otherUsers.map((u) => {
                        const active = participantIds.includes(u.id);
                        return (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => toggleParticipant(u.id)}
                                className={`px-2 py-1 rounded-md border text-[11.5px] cursor-pointer transition-colors ${
                                    active
                                        ? 'bg-accent text-white border-accent'
                                        : 'bg-surface text-muted border-border hover:border-border-strong'
                                }`}
                            >
                                {u.firstName} {u.lastName}
                            </button>
                        );
                    })}
                </div>
            </div>

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
