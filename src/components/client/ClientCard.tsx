import { HoursRing, StatusPill, Icon } from '../shared';
import { formatDate } from '../../utils/format';
import type { Client } from '../../types/index';

interface ClientCardProps {
    client: Client;
    onClick?: () => void;
}

const ClientCard = ({ client, onClick }: ClientCardProps) => {
    const childCount = client.children.length;
    const isTandem = client.assignedFachkraefte.length > 1;

    return (
        <article
            onClick={onClick}
            className="bg-surface border border-border rounded-lg overflow-hidden cursor-pointer
                 transition-colors duration-100 hover:bg-surface-hover"
        >
            {/* Hauptbereich */}
            <div className="p-4 flex gap-3 items-start">
                <div className="shrink-0">
                    <HoursRing
                        minutes={client.minutesThisWeek}
                        quotaHours={client.weeklyHoursQuota}
                        size={62}
                        strokeWidth={6}
                        showLabel
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-[15px] font-semibold text-text leading-snug tracking-[-0.01em] truncate">
                                {client.familyName}
                            </p>
                            <p className="text-[11.5px] text-muted mt-0.5 font-mono">
                                {client.caseNumber}
                            </p>
                        </div>
                        <StatusPill status={client.status} size="sm" />
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[11.5px] text-muted">
                            {childCount === 1
                                ? '1 Kind'
                                : childCount === 0
                                  ? 'Keine Kinder'
                                  : `${childCount} Kinder`}
                        </span>
                        {isTandem && (
                            <>
                                <span className="text-border-strong text-[11px]">
                                    ·
                                </span>
                                <span className="text-[11.5px] text-muted flex items-center gap-1">
                                    <Icon name="users" size={11} />
                                    Tandem
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer: nächster Termin */}
            <div className="border-t border-border px-4 py-2.5 flex items-center gap-2">
                <span style={{ color: 'var(--text-mute)', flexShrink: 0 }}>
                    <Icon name="calendar" size={12} />
                </span>
                {client.nextAppt ? (
                    <p className="text-[11.5px] text-muted leading-none">
                        {'Nächster: '}
                        <span className="text-text font-medium">
                            {formatDate(client.nextAppt.date, {
                                relative: true,
                            })}
                            {', '}
                            {new Date(client.nextAppt.date).toLocaleTimeString(
                                'de-DE',
                                {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                },
                            )}
                        </span>
                        {' · '}
                        {client.nextAppt.type}
                    </p>
                ) : (
                    <p className="text-[11.5px] text-muted leading-none">
                        Kein Termin geplant
                    </p>
                )}
            </div>
        </article>
    );
};

export default ClientCard;
