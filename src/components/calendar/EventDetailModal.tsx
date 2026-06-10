import { useState } from 'react';
import { Avatar, Button, Modal } from '../shared';
import type { ApiCalendarEvent, PopulatedUser } from '../../types';
import { api } from '../../utils/api';
import { formatDate } from '../../utils/format';
import { TYPE_LABELS } from './colors';

function isPopulated(u: PopulatedUser | string): u is PopulatedUser {
    return typeof u === 'object';
}

interface Props {
    event: ApiCalendarEvent;
    currentUserId: string;
    onClose: () => void;
    onEdit: () => void;
    onChanged: () => void | Promise<void>;
}

export default function EventDetailModal({
    event,
    currentUserId,
    onClose,
    onEdit,
    onChanged,
}: Props) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const creatorId = isPopulated(event.createdBy)
        ? event.createdBy._id
        : event.createdBy;
    const isCreator = creatorId === currentUserId;

    const myParticipant = event.participants.find((p) => {
        const id = isPopulated(p.userId) ? p.userId._id : p.userId;
        return id === currentUserId;
    });

    async function respond(response: 'accepted' | 'declined') {
        setBusy(true);
        setError(null);
        try {
            await api.post(`/calendar-events/${event._id}/respond`, {
                response,
            });
            await onChanged();
            onClose();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete() {
        if (!confirm('Termin wirklich löschen?')) return;
        setBusy(true);
        setError(null);
        try {
            await api.delete(`/calendar-events/${event._id}`);
            await onChanged();
            onClose();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal open onClose={onClose} title={event.title} width={520}>
            <div className="flex flex-col gap-3.5">
                <div className="text-[12.5px] text-muted">
                    {TYPE_LABELS[event.type] ?? event.type} ·{' '}
                    {formatDate(event.date)}
                    {event.endDate && ` – ${formatDate(event.endDate)}`}
                </div>

                {event.description && (
                    <p className="text-[13px] text-text leading-relaxed m-0 whitespace-pre-wrap">
                        {event.description}
                    </p>
                )}

                <div>
                    <div className="text-[11.5px] text-muted font-medium mb-1.5">
                        Teilnehmer
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {event.participants.map((p, i) => {
                            const populated = isPopulated(p.userId)
                                ? p.userId
                                : null;
                            const name = populated
                                ? `${populated.firstName} ${populated.lastName}`
                                : 'Unbekannt';
                            const id = populated
                                ? populated._id
                                : (p.userId as string);
                            const respClass =
                                p.response === 'accepted'
                                    ? 'text-emerald-700'
                                    : p.response === 'declined'
                                      ? 'text-rose-700'
                                      : 'text-amber-700';
                            const respLabel =
                                p.response === 'accepted'
                                    ? 'Zugesagt'
                                    : p.response === 'declined'
                                      ? 'Abgesagt'
                                      : 'Offen';
                            return (
                                <div
                                    key={`${id}-${i}`}
                                    className="flex items-center gap-2"
                                >
                                    <Avatar name={name} size={20} />
                                    <span className="text-[12.5px] text-text">
                                        {name}
                                        {id === creatorId && (
                                            <span className="text-muted ml-1">
                                                (Ersteller)
                                            </span>
                                        )}
                                    </span>
                                    <span
                                        className={`text-[11px] ${respClass} ml-auto`}
                                    >
                                        {respLabel}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {error && (
                    <p className="text-[12.5px] text-red-600 m-0">{error}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                    {!isCreator && myParticipant && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => respond('declined')}
                                disabled={busy}
                            >
                                Absagen
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => respond('accepted')}
                                disabled={busy}
                            >
                                Zusagen
                            </Button>
                        </>
                    )}
                    {isCreator && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDelete}
                                disabled={busy}
                            >
                                Löschen
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={onEdit}
                                disabled={busy}
                            >
                                Bearbeiten
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
}
