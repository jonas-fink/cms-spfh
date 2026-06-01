import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { getCurrentWeekDays, getISOWeek, isSameDay } from '../utils/format';
import type { Client, Appointment, HilfePlan, OpenTask } from '../types';

export interface UpcomingAppt extends Appointment {
    clientFamilyName: string;
}

interface DashboardData {
    clients: Client[];
    appointments: Record<string, Appointment[]>;
    hilfeplans: Record<string, HilfePlan | null>;
    openTasks: OpenTask[];
    upcomingAppts: UpcomingAppt[];
    minutesPerDay: number[];
    weekDays: Date[];
    kw: number;
    kpis: {
        activeClients: number;
        minutesThisWeek: number;
        apptsThisWeek: number;
        openGoals: number;
    };
    weekCounts: {
        durchgefuehrt: number;
        geplant: number;
    };
    loading: boolean;
    error: string | null;
}

function toISODay(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function apptMinutes(a: Appointment): number {
    return a.durationHours * 60 + a.durationMinutes;
}

export function useDashboardData(): DashboardData {
    const [clients, setClients] = useState<Client[]>([]);
    const [appointments, setAppointments] = useState<
        Record<string, Appointment[]>
    >({});
    const [hilfeplans, setHilfeplans] = useState<
        Record<string, HilfePlan | null>
    >({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { weekDays, weekDayKeys, kw } = useMemo(() => {
        const days = getCurrentWeekDays();
        return {
            weekDays: days,
            weekDayKeys: days.map(toISODay),
            kw: getISOWeek(new Date()),
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const rawClients = await api.get<Client[]>('/clients');

                const [apptResults, planResults] = await Promise.all([
                    Promise.all(
                        rawClients.map((c) =>
                            api
                                .get<Appointment[]>(
                                    `/clients/${c.id}/appointments`,
                                )
                                .then((appts) => ({ clientId: c.id, appts }))
                                .catch(() => ({
                                    clientId: c.id,
                                    appts: [] as Appointment[],
                                })),
                        ),
                    ),
                    Promise.all(
                        rawClients.map((c) =>
                            api
                                .get<HilfePlan>(`/clients/${c.id}/hilfeplan`)
                                .then((plan) => ({ clientId: c.id, plan }))
                                .catch(() => ({
                                    clientId: c.id,
                                    plan: null as HilfePlan | null,
                                })),
                        ),
                    ),
                ]);

                if (cancelled) return;

                const apptMap: Record<string, Appointment[]> = {};
                for (const { clientId, appts } of apptResults) {
                    apptMap[clientId] = appts;
                }

                const planMap: Record<string, HilfePlan | null> = {};
                for (const { clientId, plan } of planResults) {
                    planMap[clientId] = plan;
                }

                const enrichedClients: Client[] = rawClients.map((c) => {
                    const appts = apptMap[c.id] ?? [];

                    const minutesThisWeek = appts
                        .filter(
                            (a) =>
                                a.status === 'durchgeführt' &&
                                weekDayKeys.includes(a.date.slice(0, 10)),
                        )
                        .reduce((sum, a) => sum + apptMinutes(a), 0);

                    const upcoming = appts
                        .filter(
                            (a) =>
                                a.status === 'geplant' &&
                                new Date(a.date) >= new Date(),
                        )
                        .sort(
                            (a, b) =>
                                new Date(a.date).getTime() -
                                new Date(b.date).getTime(),
                        );

                    const nextAppt = upcoming[0]
                        ? { date: upcoming[0].date, type: upcoming[0].type }
                        : null;

                    return { ...c, minutesThisWeek, nextAppt };
                });

                setClients(enrichedClients);
                setAppointments(apptMap);
                setHilfeplans(planMap);
            } catch (err: unknown) {
                if (!cancelled)
                    setError((err as Error).message ?? 'Fehler beim Laden');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [weekDayKeys]);

    const derived = useMemo(() => {
        const allAppts = Object.values(appointments).flat();
        const weekApptSet = allAppts.filter((a) =>
            weekDayKeys.includes(a.date.slice(0, 10)),
        );

        const durchgefuehrt = weekApptSet.filter(
            (a) => a.status === 'durchgeführt',
        );
        const geplant = weekApptSet.filter((a) => a.status === 'geplant');

        const minutesPerDay = weekDays.map((day) =>
            allAppts
                .filter(
                    (a) =>
                        a.status === 'durchgeführt' &&
                        isSameDay(new Date(a.date), day),
                )
                .reduce((sum, a) => sum + apptMinutes(a), 0),
        );

        const minutesThisWeek = durchgefuehrt.reduce(
            (sum, a) => sum + apptMinutes(a),
            0,
        );

        const now = new Date();
        const clientMap = new Map(clients.map((c) => [c.id, c]));
        const upcomingAppts: UpcomingAppt[] = allAppts
            .filter((a) => a.status === 'geplant' && new Date(a.date) >= now)
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            )
            .slice(0, 6)
            .map((a) => ({
                ...a,
                clientFamilyName: clientMap.get(a.clientId)?.familyName ?? '–',
            }));

        const openTasks: OpenTask[] = clients
            .flatMap((c) => {
                const plan = hilfeplans[c.id];
                if (!plan) return [] as OpenTask[];
                return plan.goals
                    .filter((g) => g.status === 'offen')
                    .map((g) => ({
                        clientId: c.id,
                        clientName: c.familyName,
                        goal: g.goal,
                    }));
            })
            .sort((a, b) => a.clientName.localeCompare(b.clientName, 'de'));

        const kpis = {
            activeClients: clients.filter((c) => c.status === 'aktiv').length,
            minutesThisWeek,
            apptsThisWeek: weekApptSet.length,
            openGoals: openTasks.length,
        };

        const weekCounts = {
            durchgefuehrt: durchgefuehrt.length,
            geplant: geplant.length,
        };

        return { upcomingAppts, minutesPerDay, kpis, weekCounts, openTasks };
    }, [clients, appointments, hilfeplans, weekDays, weekDayKeys]);

    return {
        clients,
        appointments,
        hilfeplans,
        openTasks: derived.openTasks,
        upcomingAppts: derived.upcomingAppts,
        minutesPerDay: derived.minutesPerDay,
        weekDays,
        kw,
        kpis: derived.kpis,
        weekCounts: derived.weekCounts,
        loading,
        error,
    };
}
