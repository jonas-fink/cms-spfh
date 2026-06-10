import { useMemo } from 'react';
import type { ApiCalendarEvent } from '../../types';
import { DAY_LABELS, isSameDay } from '../../utils/format';
import EventCard from './EventCard';

interface WeekViewProps {
    weekStart: Date;
    events: ApiCalendarEvent[];
    currentUserId: string;
    colorMode: 'creator' | 'self';
    onEventClick: (event: ApiCalendarEvent) => void;
    onDayClick?: (day: Date) => void;
}

export default function WeekView({
    weekStart,
    events,
    currentUserId,
    colorMode,
    onEventClick,
    onDayClick,
}: WeekViewProps) {
    const days = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            d.setHours(0, 0, 0, 0);
            return d;
        });
    }, [weekStart]);

    const eventsByDay = useMemo(() => {
        const map = new Map<number, ApiCalendarEvent[]>();
        for (const ev of events) {
            const start = new Date(ev.date);
            const end = ev.endDate ? new Date(ev.endDate) : start;
            for (const day of days) {
                if (
                    isSameDay(day, start) ||
                    (start <= day && day <= end)
                ) {
                    const list = map.get(day.getTime()) ?? [];
                    if (!list.includes(ev)) list.push(ev);
                    map.set(day.getTime(), list);
                }
            }
        }
        for (const [k, list] of map) {
            list.sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            );
            map.set(k, list);
        }
        return map;
    }, [days, events]);

    const today = new Date();

    return (
        <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => {
                const dayEvents = eventsByDay.get(day.getTime()) ?? [];
                const isToday = isSameDay(day, today);
                return (
                    <div
                        key={day.toISOString()}
                        className="flex flex-col gap-1.5 min-h-[200px]"
                    >
                        <button
                            type="button"
                            onClick={() => onDayClick?.(day)}
                            className={`text-left px-2 py-1.5 rounded-md border ${
                                isToday
                                    ? 'border-accent bg-accent/5'
                                    : 'border-border bg-surface'
                            } cursor-pointer`}
                        >
                            <div className="text-[10.5px] font-medium text-muted uppercase">
                                {DAY_LABELS[i]}
                            </div>
                            <div
                                className={`text-[15px] font-semibold tabular-nums ${
                                    isToday ? 'text-accent' : 'text-text'
                                }`}
                            >
                                {day.getDate()}.{day.getMonth() + 1}.
                            </div>
                        </button>
                        <div className="flex flex-col gap-1">
                            {dayEvents.length === 0 && (
                                <div className="text-[11px] text-muted/60 italic px-1">
                                    keine Termine
                                </div>
                            )}
                            {dayEvents.map((ev) => (
                                <EventCard
                                    key={ev._id}
                                    event={ev}
                                    currentUserId={currentUserId}
                                    onClick={onEventClick}
                                    colorMode={colorMode}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
