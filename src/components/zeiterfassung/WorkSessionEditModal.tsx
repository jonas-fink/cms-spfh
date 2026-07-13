import { useState } from 'react';
import { Button, Modal } from '../shared';
import type { ApiWorkSession } from '../../types';
import { api } from '../../utils/api';

function toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}

interface Props {
    session: ApiWorkSession;
    onClose: () => void;
    onSaved: () => void | Promise<void>;
}

// Manuelle Korrektur einer Sitzung. Backend erlaubt Self-Edit und Admin,
// daher für FK- wie Admin-Seite nutzbar.
export default function WorkSessionEditModal({
    session,
    onClose,
    onSaved,
}: Props) {
    const [clockIn, setClockIn] = useState(toLocalInputValue(session.clockIn));
    const [clockOut, setClockOut] = useState(
        session.clockOut ? toLocalInputValue(session.clockOut) : '',
    );
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function save() {
        setSaving(true);
        setError(null);
        try {
            const body: Record<string, unknown> = {
                clockIn: new Date(clockIn).toISOString(),
                note: note || undefined,
            };
            if (clockOut) body.clockOut = new Date(clockOut).toISOString();
            await api.patch(`/work-sessions/${session._id}`, body);
            await onSaved();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal open onClose={onClose} title="Sitzung korrigieren" width={460}>
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
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Begründung (optional)
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
                <div className="flex justify-end gap-2 pt-1">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Abbrechen
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={save}
                        disabled={saving}
                    >
                        {saving ? 'Speichert…' : 'Speichern'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
