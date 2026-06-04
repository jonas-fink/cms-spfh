import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { KPICard, SectionHeader } from '../components/shared';
import {
    WorkloadTable,
    ClientDistribution,
    AlertsPanel,
    type FachkraftWorkload,
    type AdminAlert,
} from '../components/admin';
import { api } from '../utils/api';
import { FK_COLORS } from '../utils/colors';
import { getISOWeek } from '../utils/format';
import type { Client, Fachkraft, PopulatedUser } from '../types';

// ─── Backend-Shapes ──────────────────────────────────────────────────────────

interface ApiClient {
    _id: string;
    id?: string;
    familyName: string;
    caseNumber?: string;
    assignedFachkraefte: PopulatedUser[];
    weeklyHoursQuota: number;
    status: 'aktiv' | 'pausiert' | 'abgeschlossen';
    startDate: string;
    children: { name: string; age: number }[];
}

interface ApiWorkloadEntry {
    fachkraft: { id: string; name: string; email: string };
    clientCount: number;
    maxClients: number;
    quotaMinutes: number;
    workedMinutes: number;
    performedMinutes: number;
    cancelledCreditedCount: number;
    cancelledCreditMinutes: number;
    utilizationPercent: number;
    appointmentsThisWeek: number;
    overdueReports: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getKWString(): string {
    const now = new Date();
    return `KW ${getISOWeek(now)} · ${now.getFullYear()}`;
}

function avgUtilization(workload: FachkraftWorkload[]): number {
    if (workload.length === 0) return 0;
    const sum = workload.reduce(
        (acc, fk) =>
            acc +
            (fk.quotaMinutesThisWeek > 0
                ? fk.minutesThisWeek / fk.quotaMinutesThisWeek
                : 0),
        0,
    );
    return Math.round((sum / workload.length) * 100);
}

function deriveAlerts(workload: FachkraftWorkload[]): AdminAlert[] {
    const alerts: AdminAlert[] = [];
    for (const fk of workload) {
        if (fk.overdueReports > 0) {
            alerts.push({
                id: `overdue-${fk.id}`,
                severity: 'high',
                title: `${fk.overdueReports} Bericht${fk.overdueReports > 1 ? 'e' : ''} überfällig – ${fk.name}`,
                description:
                    'Durchgeführte Termine der letzten 14 Tage ohne Dokumentation.',
                createdAt: new Date().toISOString(),
            });
        }
        const pct =
            fk.quotaMinutesThisWeek > 0
                ? Math.round(
                      (fk.minutesThisWeek / fk.quotaMinutesThisWeek) * 100,
                  )
                : 0;
        if (pct > 105) {
            alerts.push({
                id: `overload-${fk.id}`,
                severity: 'med',
                title: `Auslastung überschritten – ${fk.name}`,
                description: `Wochenquote um ${pct - 100}% überschritten. Ggf. Klient neu zuweisen.`,
                createdAt: new Date().toISOString(),
            });
        } else if (pct > 0 && pct < 50) {
            alerts.push({
                id: `under-${fk.id}`,
                severity: 'low',
                title: `Geringe Auslastung – ${fk.name}`,
                description: `Nur ${pct}% der Wochenquote erreicht.`,
                createdAt: new Date().toISOString(),
            });
        }
    }
    return alerts;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [workload, setWorkload] = useState<FachkraftWorkload[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [fachkraefte, setFachkraefte] = useState<Fachkraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const [workloadRes, clientsRes] = await Promise.all([
                    api.get<ApiWorkloadEntry[]>('/stats/workload'),
                    api.get<ApiClient[]>('/clients'),
                ]);

                if (cancelled) return;

                const mappedWorkload: FachkraftWorkload[] = workloadRes.map(
                    (w, i) => ({
                        id: w.fachkraft.id,
                        name: w.fachkraft.name,
                        color: FK_COLORS[i % FK_COLORS.length],
                        activeClients: w.clientCount,
                        maxClients: w.maxClients,
                        minutesThisWeek: w.workedMinutes,
                        quotaMinutesThisWeek: w.quotaMinutes,
                        appointmentsThisWeek: w.appointmentsThisWeek,
                        overdueReports: w.overdueReports,
                    }),
                );

                // Fachkräfte-Liste aus Workload-Antwort ableiten
                // (FK können die /users-Route nicht aufrufen, aber Admin schon –
                //  workload enthält jedoch alle FKs, also reicht das hier)
                const mappedFachkraefte: Fachkraft[] = workloadRes.map((w) => {
                    const [firstName, ...rest] = w.fachkraft.name.split(' ');
                    return {
                        id: w.fachkraft.id,
                        firstName,
                        lastName: rest.join(' '),
                        email: w.fachkraft.email,
                        role: 'fachkraft',
                    };
                });

                const mappedClients: Client[] = clientsRes.map((c) => ({
                    id: c.id ?? c._id,
                    familyName: c.familyName,
                    caseNumber: c.caseNumber ?? '',
                    assignedFachkraefte: c.assignedFachkraefte.map(
                        (u) => u.id ?? u._id,
                    ),
                    weeklyHoursQuota: c.weeklyHoursQuota,
                    minutesThisWeek: 0,
                    status: c.status,
                    startDate: c.startDate,
                    children: c.children,
                }));

                setWorkload(mappedWorkload);
                setFachkraefte(mappedFachkraefte);
                setClients(mappedClients);
            } catch (err: unknown) {
                if (!cancelled)
                    setError(
                        (err as Error).message ??
                            'Fehler beim Laden der Admin-Übersicht',
                    );
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const alerts = useMemo(() => deriveAlerts(workload), [workload]);

    const activeClients = clients.filter((c) => c.status === 'aktiv').length;
    const totalAppointments = workload.reduce(
        (s, fk) => s + fk.appointmentsThisWeek,
        0,
    );
    const totalOverdue = workload.reduce((s, fk) => s + fk.overdueReports, 0);
    const utilPct = avgUtilization(workload);

    if (error) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-[13px] text-red-600">
                {error}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-[13px] text-muted">
                Lade Admin-Übersicht…
            </div>
        );
    }

    return (
        <div className="px-8 pt-7 pb-16 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-[24px] font-semibold text-text tracking-[-0.02em]">
                        Übersicht
                    </h1>
                    <p className="text-[13px] text-muted mt-0.5">
                        {getKWString()}
                    </p>
                </div>
            </div>

            {/* KPI Strip */}
            <div
                className="grid gap-3.5 mb-7"
                style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
            >
                <KPICard
                    label="Gesamt-Auslastung"
                    value={`${utilPct}%`}
                    sub={`Ø über ${workload.length} Fachkräfte`}
                    trend={
                        utilPct >= 90 && utilPct <= 105
                            ? 'Im Zielbereich'
                            : utilPct > 105
                              ? 'Überlastet'
                              : 'Unterausgelastet'
                    }
                    trendPositive={utilPct >= 90 && utilPct <= 105}
                    warning={utilPct > 105}
                />
                <KPICard
                    label="Aktive Klienten"
                    value={String(activeClients)}
                    sub={`${clients.length} gesamt`}
                />
                <KPICard
                    label="Termine diese Woche"
                    value={String(totalAppointments)}
                    sub="alle Fachkräfte"
                />
                <KPICard
                    label="Berichte überfällig"
                    value={String(totalOverdue)}
                    sub="noch nicht dokumentiert"
                    warning={totalOverdue > 0}
                    trend={
                        totalOverdue > 0
                            ? `${totalOverdue} ausstehend`
                            : undefined
                    }
                />
            </div>

            {/* Workload Table */}
            <div className="mb-7">
                <SectionHeader
                    title="Fachkraft-Auslastung"
                    sub="Wochenübersicht · geleistete vs. vereinbarte Stunden"
                    action="Alle Fachkräfte"
                    onAction={() => navigate('/admin/fachkraefte')}
                />
                <WorkloadTable
                    data={workload}
                    onRowClick={() => navigate('/admin/fachkraefte')}
                />
            </div>

            {/* Bottom: 2-spaltig 1.4fr 1fr */}
            <div
                className="grid gap-5"
                style={{ gridTemplateColumns: '1.4fr 1fr' }}
            >
                {/* Klienten-Verteilung */}
                <ClientDistribution
                    clients={clients}
                    fachkraefte={fachkraefte}
                    onClientClick={(id) => navigate(`/admin/clients/${id}`)}
                />

                {/* Alerts */}
                <AlertsPanel alerts={alerts} />
            </div>
        </div>
    );
}
