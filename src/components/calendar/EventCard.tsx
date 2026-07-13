import type { CalendarItem, PopulatedUser } from '../../types';
import { Avatar, Icon } from '../shared';
import { formatTime } from '../../utils/format';
import { colorForUserId, TYPE_LABELS } from './colors';

interface EventCardProps {
    item: CalendarItem;
    currentUserId: string;
    onClick?: (item: CalendarItem) => void;
    colorMode?: 'creator' | 'self';
}

function isPopulated(u: PopulatedUser | string): u is PopulatedUser {
    return typeof u === 'object';
}

function addMinutes(iso: string, minutes: number): string {
    return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export default function EventCard({
    item,
    currentUserId,
    onClick,
    colorMode = 'self',
}: EventCardProps) {
    // Klienten-Termin: eigener, kompakter Render-Zweig
    if (item.kind === 'appointment') {
        const { appt } = item;
        const familyName =
            typeof appt.clientId === 'object'
                ? appt.clientId.familyName
                : 'Klient';
        const clientKey =
            typeof appt.clientId === 'object'
                ? appt.clientId._id
                : appt.clientId;
        const color = colorForUserId(clientKey);
        const endIso = addMinutes(
            appt.date,
            appt.durationHours * 60 + appt.durationMinutes,
        );
        return (
            <button
                type="button"
                onClick={() => onClick?.(item)}
                className={`w-full text-left ${color.bg} hover:brightness-95 rounded-md px-2.5 py-2 border border-border/50 cursor-pointer transition-colors flex flex-col gap-1`}
            >
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                    <span className="text-[11px] text-muted tabular-nums">
                        {formatTime(appt.date)} – {formatTime(endIso)}
                    </span>
                    {appt.status === 'ausgefallen' && (
                        <span className="text-[10px] text-muted line-through">
                            ausgefallen
                        </span>
                    )}
                </div>
                <div className="text-[12.5px] font-medium text-text leading-tight truncate">
                    {familyName}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[10.5px] text-muted">
                        {appt.type}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted">
                        <Icon name="users" size={10} /> Klient
                    </span>
                </div>
            </button>
        );
    }

    const { event } = item;
    const creatorId = isPopulated(event.createdBy)
        ? event.createdBy._id
        : event.createdBy;
    const creatorName = isPopulated(event.createdBy)
        ? `${event.createdBy.firstName} ${event.createdBy.lastName}`
        : 'Unbekannt';

    const colorKey = colorMode === 'creator' ? creatorId : currentUserId;
    const color = colorForUserId(colorKey);

    const myParticipant = event.participants.find((p) => {
        const id = isPopulated(p.userId) ? p.userId._id : p.userId;
        return id === currentUserId;
    });

    return (
        <button
            type="button"
            onClick={() => onClick?.(item)}
            className={`w-full text-left ${color.bg} hover:brightness-95 rounded-md px-2.5 py-2 border border-border/50 cursor-pointer transition-colors flex flex-col gap-1`}
        >
            <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                <span className="text-[11px] text-muted tabular-nums">
                    {formatTime(event.date)}
                    {event.endDate && ` – ${formatTime(event.endDate)}`}
                </span>
                {event.status === 'abgesagt' && (
                    <span className="text-[10px] text-muted line-through">
                        abgesagt
                    </span>
                )}
            </div>
            <div className="text-[12.5px] font-medium text-text leading-tight truncate">
                {event.title}
            </div>
            <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] text-muted">
                    {TYPE_LABELS[event.type] ?? event.type}
                </span>
                {colorMode === 'creator' && (
                    <div className="flex items-center gap-1">
                        <Avatar name={creatorName} size={14} />
                    </div>
                )}
                {myParticipant && myParticipant.response === 'pending' && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-700">
                        <Icon name="bell" size={10} /> Einladung offen
                    </span>
                )}
            </div>
        </button>
    );
}
