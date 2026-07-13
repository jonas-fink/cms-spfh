import { useMemo } from 'react';
import type { CalendarItem } from '../../types';
import { DAY_LABELS, isSameDay } from '../../utils/format';
import EventCard from './EventCard';

interface WeekViewProps {
    weekStart: Date;
    items: CalendarItem[];
    currentUserId: string;
    colorMode: 'creator' | 'self';
    onItemClick: (item: CalendarItem) => void;
    onDayClick?: (day: Date) => void;
}

function itemKey(item: CalendarItem): string {
    return item.kind === 'event' ? `e-${item.event._id}` : `a-${item.appt._id}`;
}

function itemStart(item: CalendarItem): Date {
    return new Date(item.kind === 'event' ? item.event.date : item.appt.date);
}

function itemEnd(item: CalendarItem): Date {
    if (item.kind === 'appointment') return itemStart(item);
    return item.event.endDate ? new Date(item.event.endDate) : itemStart(item);
}

export default function WeekView({
    weekStart,
    items,
    currentUserId,
    colorMode,
    onItemClick,
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

    const itemsByDay = useMemo(() => {
        const map = new Map<number, CalendarItem[]>();
        for (const item of items) {
            const start = itemStart(item);
            const end = itemEnd(item);
            for (const day of days) {
                if (isSameDay(day, start) || (start <= day && day <= end)) {
                    const list = map.get(day.getTime()) ?? [];
                    if (!list.includes(item)) list.push(item);
                    map.set(day.getTime(), list);
                }
            }
        }
        for (const [k, list] of map) {
            list.sort(
                (a, b) => itemStart(a).getTime() - itemStart(b).getTime(),
            );
            map.set(k, list);
        }
        return map;
    }, [days, items]);

    const today = new Date();

    return (
        <div className="grid grid-cols-7 gap-2">
            {days.map((day, i) => {
                const dayItems = itemsByDay.get(day.getTime()) ?? [];
                const isToday = isSameDay(day, today);
                return (
                    <div
                        key={day.toISOString()}
                        className="flex flex-col gap-1.5 min-h-50"
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
                            {dayItems.length === 0 && (
                                <div className="text-[11px] text-muted/60 italic px-1">
                                    keine Termine
                                </div>
                            )}
                            {dayItems.map((item) => (
                                <EventCard
                                    key={itemKey(item)}
                                    item={item}
                                    currentUserId={currentUserId}
                                    onClick={onItemClick}
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
