import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button, Card, FilterBtn, Modal } from '../shared';
import type { ApiCalendarEvent } from '../../types';
import { api } from '../../utils/api';
import { getISOWeek } from '../../utils/format';
import { useAuth } from '../../context/auth';
import WeekView from './WeekView';
import CalendarEventForm from './CalendarEventForm';
import EventDetailModal from './EventDetailModal';

type Scope = 'mine' | 'team';

function startOfWeek(d: Date): Date {
    const date = new Date(d);
    const dow = date.getDay() || 7;
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - dow + 1);
    return date;
}

function addDays(d: Date, n: number): Date {
    const date = new Date(d);
    date.setDate(date.getDate() + n);
    return date;
}

export default function CalendarShell() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [scope, setScope] = useState<Scope>('mine');
    const [weekStart, setWeekStart] = useState<Date>(() =>
        startOfWeek(new Date()),
    );
    const [events, setEvents] = useState<ApiCalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [createInitialDate, setCreateInitialDate] = useState<
        Date | undefined
    >(undefined);
    const [selected, setSelected] = useState<ApiCalendarEvent | null>(null);
    const [editing, setEditing] = useState<ApiCalendarEvent | null>(null);

    const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
    const kw = useMemo(() => getISOWeek(weekStart), [weekStart]);
    const year = weekStart.getFullYear();

    const load = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({
                scope,
                from: weekStart.toISOString(),
                to: weekEnd.toISOString(),
            });
            const data = await api.get<ApiCalendarEvent[]>(
                `/calendar-events?${qs}`,
            );
            setEvents(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [scope, weekStart, weekEnd, user]);

    useEffect(() => {
        load();
    }, [load]);

    // Deep-Link: ?event=<id> → öffnet Detail-Modal
    useEffect(() => {
        const id = searchParams.get('event');
        if (!id) return;
        const local = events.find((e) => e._id === id);
        if (local) {
            setSelected(local);
            return;
        }
        api.get<ApiCalendarEvent>(`/calendar-events/${id}`)
            .then((ev) => setSelected(ev))
            .catch(() => undefined);
    }, [searchParams, events]);

    function closeDetail() {
        setSelected(null);
        if (searchParams.get('event')) {
            const next = new URLSearchParams(searchParams);
            next.delete('event');
            setSearchParams(next, { replace: true });
        }
    }

    function handleDayClick(day: Date) {
        const d = new Date(day);
        d.setHours(9, 0, 0, 0);
        setCreateInitialDate(d);
        setCreateOpen(true);
    }

    if (!user) return null;

    return (
        <div>
            <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-[24px] font-semibold text-text tracking-[-0.02em]">
                        Einsatzplaner
                    </h1>
                    <p className="text-[13px] text-muted mt-0.5">
                        KW {kw} · {year}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWeekStart(addDays(weekStart, -7))}
                    >
                        ←
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWeekStart(startOfWeek(new Date()))}
                    >
                        Heute
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWeekStart(addDays(weekStart, 7))}
                    >
                        →
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            setCreateInitialDate(undefined);
                            setCreateOpen(true);
                        }}
                    >
                        Neuer Termin
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
                <FilterBtn
                    label="Mein Kalender"
                    active={scope === 'mine'}
                    onClick={() => setScope('mine')}
                />
                <FilterBtn
                    label="Team"
                    active={scope === 'team'}
                    onClick={() => setScope('team')}
                />
            </div>

            {error && (
                <Card>
                    <div className="px-4 py-3 text-[13px] text-red-700">
                        {error}
                    </div>
                </Card>
            )}

            <Card>
                <div className="p-3">
                    {loading ? (
                        <div className="py-8 text-center text-[13px] text-muted">
                            Lade Termine…
                        </div>
                    ) : (
                        <WeekView
                            weekStart={weekStart}
                            events={events}
                            currentUserId={user.id}
                            colorMode={scope === 'team' ? 'creator' : 'self'}
                            onEventClick={setSelected}
                            onDayClick={handleDayClick}
                        />
                    )}
                </div>
            </Card>

            {createOpen && (
                <Modal
                    open
                    onClose={() => setCreateOpen(false)}
                    title="Neuer Termin"
                    width={560}
                >
                    <CalendarEventForm
                        mode="create"
                        initialDate={createInitialDate}
                        currentUserId={user.id}
                        onCancel={() => setCreateOpen(false)}
                        onSuccess={async () => {
                            setCreateOpen(false);
                            await load();
                        }}
                    />
                </Modal>
            )}

            {editing && (
                <Modal
                    open
                    onClose={() => setEditing(null)}
                    title="Termin bearbeiten"
                    width={560}
                >
                    <CalendarEventForm
                        mode="edit"
                        event={editing}
                        currentUserId={user.id}
                        onCancel={() => setEditing(null)}
                        onSuccess={async () => {
                            setEditing(null);
                            setSelected(null);
                            await load();
                        }}
                    />
                </Modal>
            )}

            {selected && !editing && (
                <EventDetailModal
                    event={selected}
                    currentUserId={user.id}
                    onClose={closeDetail}
                    onEdit={() => setEditing(selected)}
                    onChanged={load}
                />
            )}
        </div>
    );
}
