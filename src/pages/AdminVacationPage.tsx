import { useCallback, useEffect, useState } from 'react';
import { Button, Card, SectionHeader } from '../components/shared';
import VacationDenyModal from '../components/vacation/VacationDenyModal';
import type { ApiSickLeave, ApiVacationRequest, PopulatedUser } from '../types';
import { api } from '../utils/api';
import { formatDate } from '../utils/format';

function userName(u: PopulatedUser | string): string {
    return typeof u === 'object' ? `${u.firstName} ${u.lastName}` : 'Unbekannt';
}

export default function AdminVacationPage() {
    const [pending, setPending] = useState<ApiVacationRequest[]>([]);
    const [sickLeaves, setSickLeaves] = useState<ApiSickLeave[]>([]);
    const [loading, setLoading] = useState(true);
    const [denyId, setDenyId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const [reqs, sick] = await Promise.all([
            api.get<ApiVacationRequest[]>('/vacation-requests?status=pending'),
            api.get<ApiSickLeave[]>('/sick-leaves'),
        ]);
        setPending(reqs);
        setSickLeaves(sick);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function approve(id: string) {
        await api.post(`/vacation-requests/${id}/approve`);
        await load();
    }

    const activeSick = sickLeaves.filter((s) => !s.endDate);

    return (
        <div>
            <SectionHeader
                title="Urlaub & Krankmeldungen"
                sub="Offene Anträge genehmigen"
            />

            <SectionHeader
                title="Offene Urlaubsanträge"
                className="mt-4 mb-3"
            />
            {loading ? (
                <Card>
                    <div className="py-8 text-center text-[13px] text-muted">
                        Lade…
                    </div>
                </Card>
            ) : pending.length === 0 ? (
                <Card>
                    <div className="py-8 text-center text-[13px] text-muted">
                        Keine offenen Anträge.
                    </div>
                </Card>
            ) : (
                <div className="flex flex-col gap-2">
                    {pending.map((r) => (
                        <Card key={r._id}>
                            <div className="px-4 py-3 flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13.5px] font-medium text-text m-0">
                                        {userName(r.userId)}
                                    </p>
                                    <p className="text-[12.5px] text-muted m-0">
                                        {r.type === 'urlaub'
                                            ? 'Urlaub'
                                            : 'Überstundenabbau'}{' '}
                                        ·{' '}
                                        {formatDate(r.startDate, {
                                            dateOnly: true,
                                        })}{' '}
                                        –{' '}
                                        {formatDate(r.endDate, {
                                            dateOnly: true,
                                        })}{' '}
                                        · {r.workingDays} Tg
                                    </p>
                                    {r.requestNote && (
                                        <p className="text-[12px] text-muted italic m-0 mt-1">
                                            „{r.requestNote}"
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDenyId(r._id)}
                                >
                                    Ablehnen
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => approve(r._id)}
                                >
                                    Genehmigen
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <SectionHeader
                title="Aktuelle Krankmeldungen"
                className="mt-6 mb-3"
            />
            <Card>
                {activeSick.length === 0 ? (
                    <div className="py-8 text-center text-[13px] text-muted">
                        Keine aktiven Krankmeldungen.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {activeSick.map((s) => (
                            <div
                                key={s._id}
                                className="px-4 py-3 flex items-center gap-3"
                            >
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                <span className="text-[13px] text-text flex-1">
                                    {userName(s.userId)}
                                </span>
                                <span className="text-[12.5px] text-muted">
                                    seit{' '}
                                    {formatDate(s.startDate, {
                                        dateOnly: true,
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {denyId && (
                <VacationDenyModal
                    requestId={denyId}
                    onClose={() => setDenyId(null)}
                    onDenied={async () => {
                        setDenyId(null);
                        await load();
                    }}
                />
            )}
        </div>
    );
}
