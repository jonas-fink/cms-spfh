import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getCurrentWeekDays } from '../utils/format';
import type { Client, Appointment } from '../types';

interface DashboardData {
    clients: Client[];
    appointments: Record<string, Appointment[]>;
    upcomingThisWeek: Appointment[];
    kpis: {
        activeClients: number;
        minutesThisWeek: number;
        apptsThisWeek: number;
        openGoals: number;
    };
    loading: boolean;
    error: string | null;
}

function isThisWeek(dateStr: string): boolean {
    const days = getCurrentWeekDays(); // gibt Mon–Son der ISO-KW zurück
    const d = dateStr.slice(0, 10);
    return days.some((day) => day.toString() === d);
}

export function useDashboardData(): DashboardData {
    const [clients, setClients] = useState<Client[]>([]);
    const [appointments, setAppointments] = useState<
        Record<string, Appointment[]>
    >({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const clientRes = await api.get<{ data: Client[] }>('/clients');
                const rawClients = clientRes.data;

                const apptResults = await Promise.all(
                    rawClients.map(
                        (c) =>
                            api
                                .get<{ data: Appointment[] }>(
                                    `/clients/${c.id}/appointments`,
                                )
                                .then((r) => ({
                                    clientId: c.id,
                                    appts: r.data,
                                }))
                                .catch(() => ({ clientId: c.id, appts: [] })), // Einzelfehler isolieren
                    ),
                );

                if (cancelled) return;

                const apptMap: Record<string, Appointment[]> = {};
                for (const { clientId, appts } of apptResults) {
                    apptMap[clientId] = appts;
                }

                const enrichedClients: Client[] = rawClients.map((c) => {
                    const appts = apptMap[c.id] ?? [];

                    const minutesThisWeek = appts
                        .filter(
                            (a) =>
                                a.status === 'durchgeführt' &&
                                isThisWeek(a.date),
                        )
                        .reduce(
                            (sum, a) =>
                                sum + a.durationHours * 60 + a.durationMinutes,
                            0,
                        );

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
    }, []);

    const allAppts = Object.values(appointments).flat();
    const apptsThisWeek = allAppts.filter((a) => isThisWeek(a.date));
    const upcomingThisWeek = apptsThisWeek
        .filter((a) => a.status === 'geplant')
        .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

    const kpis = {
        activeClients: clients.filter((c) => c.status === 'aktiv').length,
        minutesThisWeek: clients.reduce((s, c) => s + c.minutesThisWeek, 0),
        apptsThisWeek: apptsThisWeek.length,
        openGoals: 0,
    };

    return { clients, appointments, upcomingThisWeek, kpis, loading, error };
}
