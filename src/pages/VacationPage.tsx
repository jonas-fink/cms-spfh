import { useCallback, useEffect, useState } from 'react';
import {
    Button,
    Card,
    KPICard,
    Modal,
    SectionHeader,
} from '../components/shared';
import VacationRequestForm from '../components/vacation/VacationRequestForm';
import type {
    ApiSickLeave,
    ApiVacationBalance,
    ApiVacationRequest,
    VacationStatus,
} from '../types';
import { api } from '../utils/api';
import { formatDate, formatMinutes } from '../utils/format';

const STATUS_STYLE: Record<VacationStatus, { label: string; cls: string }> = {
    pending: { label: 'Offen', cls: 'bg-amber-50 text-amber-700' },
    approved: { label: 'Genehmigt', cls: 'bg-emerald-50 text-emerald-700' },
    denied: { label: 'Abgelehnt', cls: 'bg-rose-50 text-rose-700' },
};

export default function VacationPage() {
    const [balance, setBalance] = useState<ApiVacationBalance | null>(null);
    const [requests, setRequests] = useState<ApiVacationRequest[]>([]);
    const [sickLeaves, setSickLeaves] = useState<ApiSickLeave[]>([]);
    const [loading, setLoading] = useState(true);
    const [reqOpen, setReqOpen] = useState(false);
    const [sickOpen, setSickOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const [bal, reqs, sick] = await Promise.all([
            api.get<ApiVacationBalance>('/vacation-requests/balance/me'),
            api.get<ApiVacationRequest[]>('/vacation-requests'),
            api.get<ApiSickLeave[]>('/sick-leaves'),
        ]);
        setBalance(bal);
        setRequests(reqs);
        setSickLeaves(sick);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function endSick(id: string) {
        await api.patch(`/sick-leaves/${id}/end`);
        await load();
    }

    async function cancelRequest(id: string) {
        await api.delete(`/vacation-requests/${id}`);
        await load();
    }

    return (
        <div>
            <div className="flex items-start justify-between gap-4">
                <SectionHeader title="Urlaub & Abwesenheit" />
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSickOpen(true)}
                    >
                        Krank melden
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setReqOpen(true)}
                    >
                        Urlaub beantragen
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
                <KPICard
                    label="Resturlaub"
                    value={`${balance?.remainingDays ?? 0} Tg`}
                    sub={`von ${balance?.vacationDaysPerYear ?? 0} Tg/Jahr`}
                />
                <KPICard
                    label="Genommen"
                    value={`${balance?.usedDays ?? 0} Tg`}
                />
                <KPICard
                    label="Überstunden-Saldo"
                    value={formatMinutes(balance?.overtimeMinutes ?? 0)}
                />
            </div>

            <SectionHeader title="Meine Anträge" className="mt-6 mb-3" />
            <Card>
                {loading ? (
                    <div className="py-8 text-center text-[13px] text-muted">
                        Lade…
                    </div>
                ) : requests.length === 0 ? (
                    <div className="py-8 text-center text-[13px] text-muted">
                        Keine Anträge.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {requests.map((r) => (
                            <div
                                key={r._id}
                                className="px-4 py-3 flex items-center gap-3"
                            >
                                <span
                                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status].cls}`}
                                >
                                    {STATUS_STYLE[r.status].label}
                                </span>
                                <span className="text-[13px] text-text flex-1">
                                    {r.type === 'urlaub'
                                        ? 'Urlaub'
                                        : 'Überstundenabbau'}{' '}
                                    ·{' '}
                                    {formatDate(r.startDate, {
                                        dateOnly: true,
                                    })}{' '}
                                    –{' '}
                                    {formatDate(r.endDate, { dateOnly: true })}
                                </span>
                                <span className="text-[12.5px] text-muted tabular-nums">
                                    {r.workingDays} Tg
                                </span>
                                {r.status === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={() => cancelRequest(r._id)}
                                        className="text-[12px] text-muted hover:text-red-600 transition-colors"
                                    >
                                        Zurückziehen
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <SectionHeader title="Krankmeldungen" className="mt-6 mb-3" />
            <Card>
                {sickLeaves.length === 0 ? (
                    <div className="py-8 text-center text-[13px] text-muted">
                        Keine Krankmeldungen.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {sickLeaves.map((s) => (
                            <div
                                key={s._id}
                                className="px-4 py-3 flex items-center gap-3"
                            >
                                <span
                                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                        s.endDate
                                            ? 'bg-surface text-muted'
                                            : 'bg-rose-50 text-rose-700'
                                    }`}
                                >
                                    {s.endDate ? 'Beendet' : 'Aktiv'}
                                </span>
                                <span className="text-[13px] text-text flex-1">
                                    seit{' '}
                                    {formatDate(s.startDate, {
                                        dateOnly: true,
                                    })}
                                    {s.endDate &&
                                        ` bis ${formatDate(s.endDate, { dateOnly: true })}`}
                                </span>
                                {!s.endDate && (
                                    <button
                                        type="button"
                                        onClick={() => endSick(s._id)}
                                        className="text-[12px] text-emerald-700 hover:underline"
                                    >
                                        Gesund melden
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {reqOpen && (
                <Modal
                    open
                    onClose={() => setReqOpen(false)}
                    title="Urlaub beantragen"
                    width={480}
                >
                    <VacationRequestForm
                        onCancel={() => setReqOpen(false)}
                        onSuccess={async () => {
                            setReqOpen(false);
                            await load();
                        }}
                    />
                </Modal>
            )}

            {sickOpen && (
                <SickModal
                    onClose={() => setSickOpen(false)}
                    onDone={async () => {
                        setSickOpen(false);
                        await load();
                    }}
                />
            )}
        </div>
    );
}

function SickModal({
    onClose,
    onDone,
}: {
    onClose: () => void;
    onDone: () => void | Promise<void>;
}) {
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function report() {
        setSaving(true);
        setError(null);
        try {
            await api.post('/sick-leaves', { note: note || undefined });
            await onDone();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal open onClose={onClose} title="Krank melden" width={440}>
            <div className="flex flex-col gap-3.5">
                <p className="text-[13px] text-muted m-0">
                    Die Krankmeldung gilt sofort ab heute und erzeugt einen
                    Eintrag im Einsatzplaner. Die Verwaltung wird
                    benachrichtigt.
                </p>
                <label className="flex flex-col gap-1">
                    <span className="text-[11.5px] text-muted font-medium">
                        Notiz (optional)
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
                        onClick={report}
                        disabled={saving}
                    >
                        {saving ? 'Meldet…' : 'Krank melden'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
