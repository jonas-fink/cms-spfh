import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { KPICard, SectionHeader, Icon } from '../components/shared';
import { ClientCard } from '../components/client';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import {
    formatDate,
    formatTime,
    formatDuration,
    formatFileSize,
    getGreeting,
    getISOWeek,
    getCurrentWeekDays,
    isSameDay,
    DAY_LABELS,
} from '../utils/format';
import type { Client, Appointment, ApiResponse } from '../types';

interface UpcomingAppt extends Appointment {
    clientFamilyName: string;
}

// ─── Hilfsfunktionen (nur in diesem Modul) ─────────────────────────────────────

/** Summiert Minuten aller durchgeführten Termine eines Arrays. */
function sumMinutes(appts: Appointment[]): number {
    return appts
        .filter((a) => a.status === 'durchgeführt')
        .reduce((sum, a) => sum + a.durationHours * 60 + a.durationMinutes, 0);
}

/** Gibt die Terminminuten pro Wochentag zurück (Index 0 = Mo … 6 = So). */
function minutesPerWeekDay(appts: Appointment[], weekDays: Date[]): number[] {
    return weekDays.map((day) =>
        appts
            .filter(
                (a) =>
                    a.status === 'durchgeführt' &&
                    isSameDay(new Date(a.date), day),
            )
            .reduce(
                (sum, a) => sum + a.durationHours * 60 + a.durationMinutes,
                0,
            ),
    );
}

// ─── Sub-Komponente: Wochenchart ───────────────────────────────────────────────

interface WeeklyChartProps {
    minutesPerDay: number[];
    weekDays: Date[];
    totalMinutes: number;
    kw: number;
}

function WeeklyChart({
    minutesPerDay,
    weekDays,
    totalMinutes,
    kw,
}: WeeklyChartProps) {
    const today = new Date();
    const maxMins = Math.max(...minutesPerDay, 30); // Mindest-Skala 30 min

    const totalH = Math.floor(totalMinutes / 60);
    const totalM = totalMinutes % 60;

    return (
        <div className="bg-surface border border-border rounded-lg p-5">
            <div className="flex items-end gap-2" style={{ height: 100 }}>
                {weekDays.map((day, i) => {
                    const mins = minutesPerDay[i];
                    const heightPct =
                        mins > 0 ? Math.max((mins / maxMins) * 100, 6) : 0;
                    const isToday = isSameDay(day, today);
                    const isFuture = day > today && !isToday;

                    return (
                        <div
                            key={i}
                            className="flex-1 flex flex-col items-center justify-end gap-2"
                            style={{ height: '100%' }}
                        >
                            {/* Balken */}
                            <div
                                className="w-full rounded-sm transition-all duration-500"
                                style={{
                                    height: mins > 0 ? `${heightPct}%` : 2,
                                    background: isToday
                                        ? 'var(--accent)'
                                        : isFuture
                                          ? 'var(--border)'
                                          : mins > 0
                                            ? 'var(--border-strong)'
                                            : 'var(--border)',
                                    opacity: isFuture ? 0.4 : 1,
                                    minHeight: 2,
                                }}
                            />
                            {/* Label */}
                            <span
                                className="text-[11px] font-medium leading-none"
                                style={{
                                    color: isToday
                                        ? 'var(--accent)'
                                        : 'var(--text-mute)',
                                    fontWeight: isToday ? 600 : 400,
                                }}
                            >
                                {DAY_LABELS[i]}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[11.5px] text-muted">
                    Gesamt:{' '}
                    <span className="text-text font-medium">
                        {formatDuration(totalH, totalM)}
                    </span>
                </span>
                <span className="text-[11.5px] text-muted">KW {kw}</span>
            </div>
        </div>
    );
}

// ─── Sub-Komponente: Termincard (rechte Rail) ──────────────────────────────────

function AppointmentCard({ appt }: { appt: UpcomingAppt }) {
    const apptDate = new Date(appt.date);
    const isToday = isSameDay(apptDate, new Date());

    return (
        <div className="bg-surface border border-border rounded-lg p-3.5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[13px] font-medium text-text leading-snug truncate">
                        {appt.clientFamilyName}
                    </p>
                    <p className="text-[11.5px] text-muted mt-0.5">
                        {appt.type}
                    </p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p
                        className="text-[12px] font-medium tabular-nums"
                        style={{
                            color: isToday ? 'var(--accent)' : 'var(--text)',
                        }}
                    >
                        {isToday
                            ? 'Heute'
                            : formatDate(appt.date, { relative: true })}
                    </p>
                    <p className="text-[11.5px] text-muted">
                        {formatTime(appt.date)}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Haupt-Page ────────────────────────────────────────────────────────────────

export default function FKDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [clients, setClients] = useState<Client[]>([]);
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Stabile Wochendaten (einmal berechnet)
    const today = new Date();
    const weekDays = getCurrentWeekDays();
    const kw = getISOWeek(today);

    // ── Datenabruf ───────────────────────────────────────────────────────────────

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                // 1. Klienten laden
                const clientsRes =
                    await api.get<ApiResponse<Client[]>>('/clients');
                if (cancelled) return;
                const loadedClients = clientsRes.data;
                setClients(loadedClients);

                // 2. Termine für alle Klienten parallel laden
                const apptResults = await Promise.all(
                    loadedClients.map((c) =>
                        api
                            .get<ApiResponse<Appointment[]>>(
                                `/clients/${c.id}/appointments`,
                            )
                            .then((r) => r.data)
                            .catch(() => [] as Appointment[]),
                    ),
                );
                if (cancelled) return;
                setAllAppointments(apptResults.flat());
            } catch {
                if (!cancelled) setError('Daten konnten nicht geladen werden.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    // ── Berechnete KPIs ──────────────────────────────────────────────────────────

    const activeClients = clients.filter((c) => c.status === 'aktiv');

    const weekAppts = allAppointments.filter((a) =>
        weekDays.some((d) => isSameDay(new Date(a.date), d)),
    );

    const totalMinutesKW = sumMinutes(weekAppts);
    const durchgefuehrtKW = weekAppts.filter(
        (a) => a.status === 'durchgeführt',
    ).length;
    const geplantKW = weekAppts.filter((a) => a.status === 'geplant').length;

    const minsPerDay = minutesPerWeekDay(allAppointments, weekDays);

    // Anstehende Termine (geplant + in Zukunft), sortiert + mit Klientenname
    const clientMap = new Map(clients.map((c) => [c.id, c]));

    const upcomingAppts: UpcomingAppt[] = allAppointments
        .filter((a) => a.status === 'geplant' && new Date(a.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6)
        .map((a) => ({
            ...a,
            clientFamilyName: clientMap.get(a.clientId)?.familyName ?? '–',
        }));

    // ── KPI-Werte formatieren ────────────────────────────────────────────────────

    const totalH = Math.floor(totalMinutesKW / 60);
    const totalM = totalMinutesKW % 60;
    const stundenValue =
        totalMinutesKW > 0 ? formatDuration(totalH, totalM) : '0h';

    // ── Render ───────────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="px-8 pt-7 pb-16 max-w-7xl mx-auto">
                <div className="flex items-center gap-3 text-muted text-[13px]">
                    <Icon name="clock" size={14} />
                    Lade Dashboard…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-8 pt-7 pb-16 max-w-7xl mx-auto">
                <div
                    className="flex items-center gap-2 text-[13px]"
                    style={{ color: '#dc2626' }}
                >
                    <Icon name="alert" size={14} />
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="px-8 pt-7 pb-16 max-w-7xl mx-auto">
            {/* ── 2-Spalten-Grid ── */}
            <div
                className="grid gap-6"
                style={{
                    gridTemplateColumns: '1fr 320px',
                    alignItems: 'start',
                }}
            >
                {/* ════════════════════════════════════════════════════
            LINKE SPALTE
        ════════════════════════════════════════════════════ */}
                <div className="flex flex-col gap-7">
                    {/* 1. Greeting ────────────────────────────────────── */}
                    <div>
                        <h1 className="text-[24px] font-semibold text-text tracking-[-0.02em]">
                            {getGreeting()}, <span>{user?.firstName}</span>
                        </h1>
                        <p className="text-[13px] text-muted mt-1">
                            {formatDate(today.toISOString(), { full: true })} ·
                            KW {kw}
                        </p>
                    </div>

                    {/* 2. KPI-Strip ───────────────────────────────────── */}
                    <div
                        className="grid gap-3.5"
                        style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
                    >
                        <KPICard
                            label="Aktive Klienten"
                            value={String(activeClients.length)}
                            sub={`${clients.length} gesamt`}
                        />
                        <KPICard
                            label="Stunden KW"
                            value={stundenValue}
                            sub={`${durchgefuehrtKW} Termine`}
                        />
                        <KPICard
                            label="Termine KW"
                            value={String(geplantKW + durchgefuehrtKW)}
                            sub={`${geplantKW} noch offen`}
                        />
                        <KPICard
                            label="Offene Aufgaben"
                            value="–"
                            sub="aus Hilfeplänen"
                        />
                    </div>

                    {/* 3. Klienten-Grid ───────────────────────────────── */}
                    <section>
                        <SectionHeader
                            title="Meine Klienten"
                            sub={`${activeClients.length} aktiv · ${clients.length} gesamt`}
                            action={
                                clients.length > 4 ? 'Alle anzeigen' : undefined
                            }
                            onAction={
                                clients.length > 4
                                    ? () => navigate('/clients')
                                    : undefined
                            }
                        />

                        {clients.length === 0 ? (
                            <div className="mt-4 bg-surface border border-border rounded-lg p-6 text-center">
                                <p className="text-[13px] text-muted">
                                    Keine Klienten zugewiesen.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3.5 mt-4">
                                {clients.map((client) => (
                                    <ClientCard
                                        key={client.id}
                                        client={client}
                                        onClick={() =>
                                            navigate(`/clients/${client.id}`)
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 4. Stunden-Verlauf ─────────────────────────────── */}
                    <section>
                        <SectionHeader
                            title="Stunden diese Woche"
                            sub="durchgeführte Termine"
                        />
                        <div className="mt-4">
                            <WeeklyChart
                                minutesPerDay={minsPerDay}
                                weekDays={weekDays}
                                totalMinutes={totalMinutesKW}
                                kw={kw}
                            />
                        </div>
                    </section>
                </div>

                {/* ════════════════════════════════════════════════════
            RECHTE RAIL (320px)
        ════════════════════════════════════════════════════ */}
                <div className="flex flex-col gap-6">
                    {/* Anstehende Termine ─────────────────────────────── */}
                    <section>
                        <SectionHeader
                            title="Anstehende Termine"
                            action={
                                upcomingAppts.length > 0
                                    ? 'Alle Termine'
                                    : undefined
                            }
                            onAction={() => navigate('/calendar')}
                        />

                        <div className="flex flex-col gap-2.5 mt-4">
                            {upcomingAppts.length === 0 ? (
                                <div className="bg-surface border border-border rounded-lg p-4">
                                    <p className="text-[13px] text-muted">
                                        Keine anstehenden Termine.
                                    </p>
                                </div>
                            ) : (
                                upcomingAppts.map((appt) => (
                                    <AppointmentCard
                                        key={appt.id}
                                        appt={appt}
                                    />
                                ))
                            )}
                        </div>
                    </section>

                    {/* Offene Aufgaben ─────────────────────────────────── */}
                    <section>
                        <SectionHeader title="Offene Aufgaben" />

                        <div className="bg-surface border border-border rounded-lg p-4 mt-4 flex flex-col gap-2">
                            {/* Placeholder – wird in Phase 4+ aus HilfePlan-Goals befüllt */}
                            <div className="flex items-center gap-2 py-1">
                                <span style={{ color: 'var(--border-strong)' }}>
                                    <Icon name="check" size={13} />
                                </span>
                                <p className="text-[13px] text-muted italic">
                                    Aufgaben werden aus Hilfeplänen geladen…
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
