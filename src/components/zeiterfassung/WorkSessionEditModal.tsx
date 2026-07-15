import { useState } from 'react';
import { Button, Modal } from '../shared';
import type { ApiWorkSession } from '../../types';
import { api } from '../../utils/api';

function toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}

interface BreakRow {
    start: string;
    end: string;
}

interface Props {
    // null → neuen Eintrag manuell anlegen
    session: ApiWorkSession | null;
    onClose: () => void;
    onSaved: () => void | Promise<void>;
}

// Manuelle Korrektur oder Neuanlage einer Sitzung. Backend erlaubt Self-Edit
// und Admin, daher für FK- wie Admin-Seite nutzbar.
export default function WorkSessionEditModal({
    session,
    onClose,
    onSaved,
}: Props) {
    const isCreate = session === null;
    const [clockIn, setClockIn] = useState(
        toLocalInputValue(session?.clockIn ?? new Date().toISOString()),
    );
    const [clockOut, setClockOut] = useState(
        session?.clockOut ? toLocalInputValue(session.clockOut) : '',
    );
    const [breaks, setBreaks] = useState<BreakRow[]>(
        (session?.breaks ?? []).map((b) => ({
            start: toLocalInputValue(b.start),
            end: b.end ? toLocalInputValue(b.end) : '',
        })),
    );
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function updateBreak(idx: number, field: keyof BreakRow, value: string) {
        setBreaks((prev) =>
            prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)),
        );
    }
    function addBreak() {
        setBreaks((prev) => [...prev, { start: clockIn, end: '' }]);
    }
    function removeBreak(idx: number) {
        setBreaks((prev) => prev.filter((_, i) => i !== idx));
    }

    async function save() {
        // Nur Pausen mit Startzeit; Ende (wenn gesetzt) muss nach Start liegen.
        const rows = breaks.filter((b) => b.start);
        for (const b of rows) {
            if (b.end && new Date(b.end) < new Date(b.start)) {
                setError('Pausenende liegt vor dem Pausenbeginn.');
                return;
            }
        }
        if (clockOut && new Date(clockOut) < new Date(clockIn)) {
            setError('Ausstempeln liegt vor dem Einstempeln.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const body: Record<string, unknown> = {
                clockIn: new Date(clockIn).toISOString(),
                breaks: rows.map((b) => ({
                    start: new Date(b.start).toISOString(),
                    end: b.end ? new Date(b.end).toISOString() : undefined,
                })),
            };
            if (clockOut) body.clockOut = new Date(clockOut).toISOString();
            if (isCreate) {
                if (note) body.notes = note;
                await api.post('/work-sessions', body);
            } else {
                if (note) body.note = note; // Begründung → editHistory
                await api.patch(`/work-sessions/${session._id}`, body);
            }
            await onSaved();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function remove() {
        if (!session) return;
        if (!window.confirm('Diesen Eintrag wirklich löschen?')) return;
        setDeleting(true);
        setError(null);
        try {
            await api.delete(`/work-sessions/${session._id}`);
            await onSaved();
        } catch (err) {
            setError((err as Error).message);
            setDeleting(false);
        }
    }

    return (
        <Modal
            open
            onClose={onClose}
            title={isCreate ? 'Sitzung hinzufügen' : 'Sitzung korrigieren'}
            width={460}
        >
            <div className="flex flex-col gap-3.5">
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Einstempeln
                    </span>
                    <input
                        type="datetime-local"
                        value={clockIn}
                        onChange={(e) => setClockIn(e.target.value)}
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text"
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Ausstempeln
                    </span>
                    <input
                        type="datetime-local"
                        value={clockOut}
                        onChange={(e) => setClockOut(e.target.value)}
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text"
                    />
                </label>
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[11.5px] text-muted font-medium">
                            Pausen
                        </span>
                        <button
                            type="button"
                            onClick={addBreak}
                            className="text-[12px] text-accent font-medium"
                        >
                            + Pause hinzufügen
                        </button>
                    </div>
                    {breaks.length === 0 && (
                        <p className="text-[12px] text-muted m-0">
                            Keine Pausen erfasst.
                        </p>
                    )}
                    {breaks.map((b, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                type="datetime-local"
                                value={b.start}
                                onChange={(e) =>
                                    updateBreak(i, 'start', e.target.value)
                                }
                                className="h-9 flex-1 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text"
                            />
                            <span className="text-muted text-[12px]">–</span>
                            <input
                                type="datetime-local"
                                value={b.end}
                                onChange={(e) =>
                                    updateBreak(i, 'end', e.target.value)
                                }
                                className="h-9 flex-1 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text"
                            />
                            <button
                                type="button"
                                onClick={() => removeBreak(i)}
                                title="Pause entfernen"
                                className="text-muted hover:text-text px-1.5"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        {isCreate ? 'Notiz (optional)' : 'Begründung (optional)'}
                    </span>
                    <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text"
                    />
                </label>
                {error && (
                    <p className="text-[12.5px] text-red-600 m-0">{error}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                    {!isCreate && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={remove}
                            disabled={deleting || saving}
                            className="text-red-600"
                        >
                            {deleting ? 'Löscht…' : 'Löschen'}
                        </Button>
                    )}
                    <div className="flex justify-end gap-2 flex-1">
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Abbrechen
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={save}
                            disabled={saving || deleting}
                        >
                            {saving ? 'Speichert…' : 'Speichern'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
