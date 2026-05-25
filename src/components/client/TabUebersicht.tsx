import {
    Icon,
    StatusPill,
    Avatar,
    Card,
    GoalCheck,
    SectionHeader,
} from '../shared';
import { formatDate, formatDuration } from '../../utils/format';
import type { Client, Appointment, HilfePlan, FKMap } from '../../types';

interface TabUebersichtProps {
    client: Client;
    appointments: Appointment[];
    hilfeplan: HilfePlan | null;
    fkMap: FKMap;
}

export function TabUebersicht({
    client,
    appointments,
    hilfeplan,
    fkMap,
}: TabUebersichtProps) {
    const recentAppts = [...appointments]
        .filter((a) => a.status === 'durchgeführt')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

    return (
        <div className="grid grid-cols-[1fr_320px] gap-6">
            {/* Links */}
            <div className="flex flex-col gap-4">
                <Card>
                    <div className="px-5 pt-4 pb-3">
                        <SectionHeader title="Letzte Aktivitäten" />
                    </div>
                    {recentAppts.length === 0 ? (
                        <p className="px-5 pb-5 text-[13px] text-muted">
                            Noch keine Termine dokumentiert.
                        </p>
                    ) : (
                        recentAppts.map((appt) => (
                            <div
                                key={appt.id}
                                className="px-5 py-3 border-t border-border flex gap-3"
                            >
                                <div className="shrink-0 w-8 h-8 rounded-lg bg-accent/8 flex items-center justify-center">
                                    <Icon
                                        name="calendar"
                                        size={15}
                                        stroke={1.75}
                                        color="var(--accent)"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[13px] font-medium text-text">
                                            {appt.type}
                                        </span>
                                        <StatusPill
                                            status="durchgeführt"
                                            size="sm"
                                        />
                                    </div>
                                    <div className="text-xs text-muted mb-1">
                                        {formatDate(appt.date, {
                                            relative: true,
                                        })}{' '}
                                        ·{' '}
                                        {formatDuration(
                                            appt.durationHours,
                                            appt.durationMinutes,
                                        )}
                                    </div>
                                    {appt.report && (
                                        <p className="text-[12.5px] text-muted leading-[1.5] m-0 line-clamp-2">
                                            {appt.report}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </Card>

                {hilfeplan && (
                    <Card>
                        <div className="px-5 pt-4 pb-3">
                            <SectionHeader
                                title="Hilfeplan-Ziele"
                                sub={`Version ${hilfeplan.version} · ${formatDate(hilfeplan.updatedAt, { dateOnly: true })}`}
                            />
                        </div>
                        <div className="px-5 pb-4">
                            {hilfeplan.goals.map((g, i) => (
                                <GoalCheck
                                    key={i}
                                    goal={g.goal}
                                    status={g.status}
                                    readonly
                                />
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {/* Rechte Rail */}
            <div className="flex flex-col gap-3.5">
                <Card>
                    <div className="px-5 pt-4 pb-3">
                        <SectionHeader
                            title="Familie"
                            sub={`${client.children.length} ${client.children.length === 1 ? 'Kind' : 'Kinder'}`}
                        />
                    </div>
                    <div className="px-5 pb-4 flex flex-col gap-2">
                        {client.children.map((child, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 px-3 py-2 bg-surface-hover rounded-lg"
                            >
                                <Avatar name={child.name} size={28} />
                                <div>
                                    <div className="text-[13px] font-medium text-text">
                                        {child.name}
                                    </div>
                                    <div className="text-[11.5px] text-muted">
                                        {child.age} Jahre
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <div className="px-5 pt-4 pb-3">
                        <SectionHeader title="Betreuung" />
                    </div>
                    <div className="px-5 pb-4 flex flex-col gap-2.5">
                        {client.assignedFachkraefte.map((fkId) => {
                            const fk = fkMap[fkId];
                            if (!fk) return null;
                            return (
                                <div
                                    key={fkId}
                                    className="flex items-center gap-2.5"
                                >
                                    <Avatar
                                        name={fk.name}
                                        size={28}
                                        color={fk.color}
                                    />
                                    <div>
                                        <div className="text-[13px] font-medium text-text">
                                            {fk.name}
                                        </div>
                                        <div className="text-[11.5px] text-muted">
                                            Fachkraft
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {client.jugendamtContact && (
                            <>
                                <div className="h-px bg-border my-1" />
                                <div>
                                    <div className="text-[11px] font-medium text-muted uppercase tracking-[0.04em] mb-0.5">
                                        Jugendamt
                                    </div>
                                    <div className="text-[13px] font-medium text-text">
                                        {client.jugendamtContact}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </Card>

                <Card>
                    <div className="px-5 pt-4 pb-3">
                        <SectionHeader
                            title="Notizen"
                            action="Bearbeiten"
                            onAction={() => {}}
                        />
                    </div>
                    <p className="px-5 pb-5 text-[13px] text-muted leading-relaxed m-0">
                        Keine Notizen vorhanden.
                    </p>
                </Card>
            </div>
        </div>
    );
}
