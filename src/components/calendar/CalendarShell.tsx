import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button, Card, FilterBtn, Modal } from '../shared';
import type {
    ApiCalendarAppointment,
    ApiCalendarEvent,
    ApiClient,
    Appointment,
    CalendarItem,
    Fachkraft,
} from '../../types';
import { api } from '../../utils/api';
import { getISOWeek } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import WeekView from './WeekView';
import CalendarEventForm from './CalendarEventForm';
import EventDetailModal from './EventDetailModal';
import AppointmentForm from '../appointment/AppointmentForm';

type Scope = 'mine' | 'team';
type CreateKind = 'event' | 'appointment';

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

function toAppointment(a: ApiCalendarAppointment): {
    clientId: string;
    appointment: Appointment;
} {
    const clientId =
        typeof a.clientId === 'object' ? a.clientId._id : a.clientId;
    return {
        clientId,
        appointment: {
            id: a._id,
            clientId,
            createdBy:
                typeof a.createdBy === 'object' ? a.createdBy._id : a.createdBy,
            type: a.type,
            status: a.status,
            date: a.date,
            durationHours: a.durationHours,
            durationMinutes: a.durationMinutes,
            report: a.report,
        },
    };
}

export default function CalendarShell() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [scope, setScope] = useState<Scope>('mine');
    const [weekStart, setWeekStart] = useState<Date>(() =>
        startOfWeek(new Date()),
    );
    const [events, setEvents] = useState<ApiCalendarEvent[]>([]);
    const [appointments, setAppointments] = useState<ApiCalendarAppointment[]>(
        [],
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [createKind, setCreateKind] = useState<CreateKind>('event');
    const [createInitialDate, setCreateInitialDate] = useState<
        Date | undefined
    >(undefined);
    const [clients, setClients] = useState<ApiClient[]>([]);
    const [createClientId, setCreateClientId] = useState('');
    const [selected, setSelected] = useState<ApiCalendarEvent | null>(null);
    const [editing, setEditing] = useState<ApiCalendarEvent | null>(null);
    const [editAppt, setEditAppt] = useState<{
        clientId: string;
        appointment: Appointment;
    } | null>(null);
    // Admin-Filter: Termine einer einzelnen Fachkraft ('' = alle)
    const [fachkraefte, setFachkraefte] = useState<Fachkraft[]>([]);
    const [fachkraftFilter, setFachkraftFilter] = useState('');

    const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
    const kw = useMemo(() => getISOWeek(weekStart), [weekStart]);
    const year = weekStart.getFullYear();

    const items = useMemo<CalendarItem[]>(
        () => [
            ...events.map((event) => ({ kind: 'event' as const, event })),
            ...appointments.map((appt) => ({
                kind: 'appointment' as const,
                appt,
            })),
        ],
        [events, appointments],
    );

    const load = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const from = weekStart.toISOString();
            const to = weekEnd.toISOString();
            const eventsQs = new URLSearchParams({ scope, from, to });
            // Termine: FK sieht Backend-seitig nur eigene; Admin filtert per Dropdown.
            const apptQs = new URLSearchParams({ from, to });
            if (user.role === 'admin' && fachkraftFilter) {
                eventsQs.set('fachkraftId', fachkraftFilter);
                apptQs.set('fachkraftId', fachkraftFilter);
            }
            const [ev, appts] = await Promise.all([
                api.get<ApiCalendarEvent[]>(`/calendar-events?${eventsQs}`),
                api.get<ApiCalendarAppointment[]>(`/appointments?${apptQs}`),
            ]);
            setEvents(ev);
            setAppointments(appts);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [scope, weekStart, weekEnd, user, fachkraftFilter]);

    useEffect(() => {
        load();
    }, [load]);

    // Fachkraft-Liste für den Admin-Filter einmalig laden
    useEffect(() => {
        if (user?.role !== 'admin') return;
        api.get<Fachkraft[]>('/users')
            .then((list) =>
                setFachkraefte(list.filter((u) => u.role === 'fachkraft')),
            )
            .catch(() => setFachkraefte([]));
    }, [user?.role]);

    // Klienten für das Dropdown (Klienten-Termin anlegen) einmalig laden
    useEffect(() => {
        if (!createOpen || createKind !== 'appointment' || clients.length > 0)
            return;
        api.get<ApiClient[]>('/clients')
            .then((list) => {
                setClients(list);
                if (list.length > 0) setCreateClientId(list[0]._id);
            })
            .catch(() => setClients([]));
    }, [createOpen, createKind, clients.length]);

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

    function handleItemClick(item: CalendarItem) {
        if (item.kind === 'event') {
            setSelected(item.event);
            return;
        }
        // Klienten-Termin → direkt bearbeiten (z.B. Status korrigieren)
        setEditAppt(toAppointment(item.appt));
    }

    function openCreate(kind: CreateKind, day?: Date) {
        setCreateKind(kind);
        setCreateInitialDate(day);
        setCreateOpen(true);
    }

    function handleDayClick(day: Date) {
        const d = new Date(day);
        d.setHours(9, 0, 0, 0);
        openCreate('event', d);
    }

    async function afterCreate() {
        setCreateOpen(false);
        await load();
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
                        onClick={() => openCreate('event')}
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
                {user.role === 'admin' && (
                    <select
                        value={fachkraftFilter}
                        onChange={(e) => setFachkraftFilter(e.target.value)}
                        className="ml-auto h-8 px-2.5 rounded-md bg-surface border border-border text-[12.5px] text-text focus:outline-none focus:border-border-strong"
                    >
                        <option value="">Alle Fachkräfte</option>
                        {fachkraefte.map((fk) => (
                            <option key={fk.id} value={fk.id}>
                                {fk.firstName} {fk.lastName}
                            </option>
                        ))}
                    </select>
                )}
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
                            items={items}
                            currentUserId={user.id}
                            colorMode={scope === 'team' ? 'creator' : 'self'}
                            onItemClick={handleItemClick}
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
                    <div className="flex items-center gap-2 mb-4">
                        <FilterBtn
                            label="Interner Termin"
                            active={createKind === 'event'}
                            onClick={() => setCreateKind('event')}
                        />
                        <FilterBtn
                            label="Klienten-Termin"
                            active={createKind === 'appointment'}
                            onClick={() => setCreateKind('appointment')}
                        />
                    </div>

                    {createKind === 'event' ? (
                        <CalendarEventForm
                            mode="create"
                            initialDate={createInitialDate}
                            currentUserId={user.id}
                            onCancel={() => setCreateOpen(false)}
                            onSuccess={afterCreate}
                        />
                    ) : clients.length === 0 ? (
                        <div className="py-6 text-center text-[13px] text-muted">
                            Keine Klienten verfügbar.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3.5">
                            <label className="flex flex-col gap-1">
                                <span className="text-[11.5px] text-muted font-medium">
                                    Klient
                                </span>
                                <select
                                    value={createClientId}
                                    onChange={(e) =>
                                        setCreateClientId(e.target.value)
                                    }
                                    className="h-9 px-2.5 rounded-md bg-bg border border-border text-[13px] text-text focus:outline-none focus:border-border-strong"
                                >
                                    {clients.map((c) => (
                                        <option key={c._id} value={c._id}>
                                            {c.familyName} ({c.caseNumber})
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {createClientId && (
                                <AppointmentForm
                                    key={createClientId}
                                    clientId={createClientId}
                                    mode="create"
                                    initialDate={createInitialDate}
                                    onCancel={() => setCreateOpen(false)}
                                    onSuccess={afterCreate}
                                />
                            )}
                        </div>
                    )}
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

            {editAppt && (
                <Modal
                    open
                    onClose={() => setEditAppt(null)}
                    title="Klienten-Termin bearbeiten"
                    width={560}
                >
                    {/* Kein assignedFachkraefte → Tandem-Teilnehmer bleiben unangetastet */}
                    <AppointmentForm
                        clientId={editAppt.clientId}
                        mode="edit"
                        appointment={editAppt.appointment}
                        onCancel={() => setEditAppt(null)}
                        onSuccess={async () => {
                            setEditAppt(null);
                            await load();
                        }}
                    />
                </Modal>
            )}
        </div>
    );
}
