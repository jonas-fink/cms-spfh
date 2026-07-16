import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '../shared';
import type { VacationType } from '../../types';
import { api } from '../../utils/api';

function countWorkingDays(startIso: string, endIso: string): number {
    if (!startIso || !endIso) return 0;
    const s = new Date(startIso);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endIso);
    e.setHours(0, 0, 0, 0);
    if (e < s) return 0;
    let count = 0;
    for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) count++;
    }
    return count;
}

const TYPES: { value: VacationType; label: string }[] = [
    { value: 'urlaub', label: 'Urlaub' },
    { value: 'ueberstundenabbau', label: 'Überstundenabbau' },
];

interface Props {
    onSuccess: () => void | Promise<void>;
    onCancel: () => void;
}

export default function VacationRequestForm({ onSuccess, onCancel }: Props) {
    const [type, setType] = useState<VacationType>('urlaub');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [requestNote, setRequestNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const workingDays = useMemo(
        () => countWorkingDays(startDate, endDate),
        [startDate, endDate],
    );

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        if (!startDate || !endDate) {
            setError('Zeitraum erforderlich');
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/vacation-requests', {
                type,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                requestNote: requestNote || undefined,
            });
            await onSuccess();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-muted font-medium">
                    Typ
                </span>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as VacationType)}
                    className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text"
                >
                    {TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Von
                    </span>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text"
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Bis
                    </span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text"
                    />
                </label>
            </div>

            <p className="text-[12.5px] text-muted m-0">
                {workingDays} Werktag(e) (ohne Wochenende)
            </p>

            <label className="flex flex-col gap-1">
                <span className="text-[11.5px] text-muted font-medium">
                    Begründung (optional)
                </span>
                <textarea
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    rows={3}
                    className="px-2.5 py-2 rounded-md bg-bg border border-border text-[13px] text-text resize-y"
                />
            </label>

            {error && <p className="text-[12.5px] text-red-600 m-0">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={onCancel}>
                    Abbrechen
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={submitting}
                >
                    {submitting ? 'Sendet…' : 'Antrag stellen'}
                </Button>
            </div>
        </form>
    );
}
