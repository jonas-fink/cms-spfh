import { useNavigate } from 'react-router';
import { Icon, StatusPill, Avatar, Button, HoursRing, TabBtn } from '../shared';
import { formatDate } from '../../utils/format';
import type { Client, FKMap, ActiveTab } from '../../types';

interface ClientDetailHeaderProps {
    client: Client;
    fkMap: FKMap;
    activeTab: ActiveTab;
    tabs: { key: ActiveTab; label: string; count?: number }[];
    onTabChange: (tab: ActiveTab) => void;
}

export function ClientDetailHeader({
    client,
    fkMap,
    activeTab,
    tabs,
    onTabChange,
}: ClientDetailHeaderProps) {
    const navigate = useNavigate();
    const isTandem = client.assignedFachkraefte.length > 1;
    const minutesH = Math.floor(client.minutesThisWeek / 60);
    const minutesM = client.minutesThisWeek % 60;

    return (
        <div className="sticky top-0 z-10 bg-bg border-b border-border px-8 pt-4">
            {/* Zurück */}
            <button
                onClick={() => navigate('/clients')}
                className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-muted text-[12.5px] mb-2.5 p-0"
            >
                <Icon name="chevronLeft" size={14} stroke={2} />
                Alle Klienten
            </button>

            {/* Titel + Badges */}
            <div className="flex items-center gap-2.5 mb-1.5">
                <h1 className="text-[22px] font-semibold text-text tracking-[-0.02em] m-0">
                    Familie {client.familyName}
                </h1>
                <StatusPill status={client.status} size="md" />
                {isTandem && (
                    <span className="text-[11.5px] font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-[5px]">
                        Tandem
                    </span>
                )}
            </div>

            {/* Meta + Aktions-Buttons */}
            <div className="flex items-center gap-4 mb-3.5 flex-wrap">
                <span className="flex items-center gap-1 text-[12.5px] text-muted">
                    <Icon name="file" size={13} stroke={1.75} />
                    {client.caseNumber}
                </span>
                {client.address && (
                    <span className="flex items-center gap-1 text-[12.5px] text-muted">
                        <Icon name="pin" size={13} stroke={1.75} />
                        {client.address}
                    </span>
                )}
                <span className="flex items-center gap-1 text-[12.5px] text-muted">
                    <Icon name="clock" size={13} stroke={1.75} />
                    seit {formatDate(client.startDate, { dateOnly: true })}
                </span>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="secondary" size="sm" icon="phone">
                        Anrufen
                    </Button>
                    <Button variant="secondary" size="sm" icon="file">
                        Dokument
                    </Button>
                    <Button variant="primary" size="sm" icon="plus">
                        Neuer Termin
                    </Button>
                    <button className="w-[30px] h-[30px] rounded-[7px] border border-border bg-surface flex items-center justify-center cursor-pointer text-muted hover:bg-surface-hover transition-colors duration-100">
                        <Icon name="moreH" size={15} stroke={1.75} />
                    </button>
                </div>
            </div>

            {/* Quick-Stats Strip */}
            <div className="flex items-center border-t border-border py-2.5">
                {/* Stunden KW */}
                <div className="flex items-center gap-2.5 pr-6">
                    <HoursRing
                        minutes={client.minutesThisWeek}
                        quotaHours={client.weeklyHoursQuota}
                        size={40}
                        strokeWidth={5}
                        showLabel={false}
                    />
                    <div>
                        <div className="text-[11px] font-medium text-muted uppercase tracking-[0.04em] mb-0.5">
                            Stunden KW
                        </div>
                        <div className="text-[13px] font-semibold text-text tabular-nums">
                            {minutesH}:{String(minutesM).padStart(2, '0')}h
                            <span className="font-normal text-muted text-xs">
                                {' '}
                                / {client.weeklyHoursQuota}h
                            </span>
                        </div>
                    </div>
                </div>

                <div className="w-px h-8 bg-border mx-6" />

                {/* Betreuung */}
                <div className="pr-6">
                    <div className="text-[11px] font-medium text-muted uppercase tracking-[0.04em] mb-1">
                        Betreuung
                    </div>
                    <div className="flex items-center gap-1.5">
                        {client.assignedFachkraefte.map((fkId, i) => {
                            const fk = fkMap[fkId];
                            return fk ? (
                                <div
                                    key={fkId}
                                    className={i > 0 ? '-ml-1.5' : ''}
                                >
                                    <Avatar
                                        name={fk.name}
                                        size={22}
                                        color={fk.color}
                                    />
                                </div>
                            ) : null;
                        })}
                        <span className="text-[12.5px] text-text ml-1">
                            {client.assignedFachkraefte
                                .map((fkId) => fkMap[fkId]?.name.split(' ')[0])
                                .filter(Boolean)
                                .join(' + ')}
                        </span>
                    </div>
                </div>

                <div className="w-px h-8 bg-border mx-6" />

                {/* Jugendamt */}
                <div className="pr-6">
                    <div className="text-[11px] font-medium text-muted uppercase tracking-[0.04em] mb-1">
                        Jugendamt
                    </div>
                    <div className="text-[12.5px] font-medium text-text">
                        {client.jugendamtContact ?? '—'}
                    </div>
                </div>

                <div className="w-px h-8 bg-border mx-6" />

                {/* Kinder */}
                <div className="pr-6">
                    <div className="text-[11px] font-medium text-muted uppercase tracking-[0.04em] mb-1">
                        Kinder
                    </div>
                    <div className="text-[12.5px] font-medium text-text">
                        {client.children.length} (
                        {client.children.map((c) => c.name).join(', ')})
                    </div>
                </div>

                <div className="w-px h-8 bg-border mx-6" />

                {/* Nächster Termin */}
                <div>
                    <div className="text-[11px] font-medium text-muted uppercase tracking-[0.04em] mb-1">
                        Nächster Termin
                    </div>
                    <div className="text-[12.5px] font-medium text-text">
                        {client.nextAppt
                            ? `${formatDate(client.nextAppt.date, { relative: true })} · ${client.nextAppt.type}`
                            : '—'}
                    </div>
                </div>
            </div>

            {/* Tab-Bar */}
            <div className="flex gap-5">
                {tabs.map((tab) => (
                    <TabBtn
                        key={tab.key}
                        label={tab.label}
                        active={activeTab === tab.key}
                        count={tab.count}
                        onClick={() => onTabChange(tab.key)}
                    />
                ))}
            </div>
        </div>
    );
}
