import { useState } from 'react';
import { KPICard, SectionHeader, Icon } from '../components/shared';
import {
    WorkloadTable,
    ClientDistribution,
    AlertsPanel,
    type FachkraftWorkload,
    type AdminAlert,
} from '../components/admin';
import type { Client, Fachkraft } from '../types';

const MOCK_FACHKRAEFTE: Fachkraft[] = [
    {
        id: 'fk1',
        firstName: 'Anna',
        lastName: 'Berger',
        email: 'a.berger@spfh.de',
        role: 'fachkraft',
    },
    {
        id: 'fk2',
        firstName: 'Markus',
        lastName: 'Lehner',
        email: 'm.lehner@spfh.de',
        role: 'fachkraft',
    },
    {
        id: 'fk3',
        firstName: 'Sara',
        lastName: 'Wolff',
        email: 's.wolff@spfh.de',
        role: 'fachkraft',
    },
    {
        id: 'fk4',
        firstName: 'Tobias',
        lastName: 'Huber',
        email: 't.huber@spfh.de',
        role: 'fachkraft',
    },
];

const MOCK_WORKLOAD: FachkraftWorkload[] = [
    {
        id: 'fk1',
        name: 'Anna Berger',
        color: '#6366f1',
        activeClients: 4,
        maxClients: 6,
        minutesThisWeek: 285,
        quotaMinutesThisWeek: 360,
        appointmentsThisWeek: 5,
        overdueReports: 1,
    },
    {
        id: 'fk2',
        name: 'Markus Lehner',
        color: '#0ea5e9',
        activeClients: 6,
        maxClients: 6,
        minutesThisWeek: 390,
        quotaMinutesThisWeek: 360,
        appointmentsThisWeek: 7,
        overdueReports: 2,
    },
    {
        id: 'fk3',
        name: 'Sara Wolff',
        color: '#10b981',
        activeClients: 3,
        maxClients: 6,
        minutesThisWeek: 150,
        quotaMinutesThisWeek: 360,
        appointmentsThisWeek: 3,
        overdueReports: 0,
    },
    {
        id: 'fk4',
        name: 'Tobias Huber',
        color: '#f59e0b',
        activeClients: 5,
        maxClients: 6,
        minutesThisWeek: 320,
        quotaMinutesThisWeek: 360,
        appointmentsThisWeek: 6,
        overdueReports: 0,
    },
];

const MOCK_CLIENTS: Client[] = [
    {
        id: 'c1',
        familyName: 'Müller',
        caseNumber: 'JA-2024-0312',
        assignedFachkraefte: ['fk1', 'fk2'],
        weeklyHoursQuota: 6,
        minutesThisWeek: 285,
        status: 'aktiv',
        startDate: '2024-03-01',
        children: [
            { name: 'Lena', age: 8 },
            { name: 'Tim', age: 5 },
        ],
    },
    {
        id: 'c2',
        familyName: 'Schmidt',
        caseNumber: 'JA-2024-0418',
        assignedFachkraefte: ['fk1'],
        weeklyHoursQuota: 4,
        minutesThisWeek: 120,
        status: 'aktiv',
        startDate: '2024-04-15',
        children: [{ name: 'Max', age: 12 }],
    },
    {
        id: 'c3',
        familyName: 'Bauer',
        caseNumber: 'JA-2023-1102',
        assignedFachkraefte: ['fk3'],
        weeklyHoursQuota: 3,
        minutesThisWeek: 90,
        status: 'aktiv',
        startDate: '2023-11-01',
        children: [],
    },
    {
        id: 'c4',
        familyName: 'Fischer',
        caseNumber: 'JA-2025-0028',
        assignedFachkraefte: ['fk2', 'fk4'],
        weeklyHoursQuota: 8,
        minutesThisWeek: 200,
        status: 'aktiv',
        startDate: '2025-01-10',
        children: [{ name: 'Anna', age: 3 }],
    },
    {
        id: 'c5',
        familyName: 'Wagner',
        caseNumber: 'JA-2024-0891',
        assignedFachkraefte: ['fk4'],
        weeklyHoursQuota: 4,
        minutesThisWeek: 60,
        status: 'pausiert',
        startDate: '2024-09-01',
        children: [
            { name: 'Ella', age: 7 },
            { name: 'Noah', age: 9 },
        ],
    },
    {
        id: 'c6',
        familyName: 'Weber',
        caseNumber: 'JA-2025-0145',
        assignedFachkraefte: ['fk3'],
        weeklyHoursQuota: 5,
        minutesThisWeek: 0,
        status: 'aktiv',
        startDate: '2025-02-20',
        children: [],
    },
];

const MOCK_ALERTS: AdminAlert[] = [
    {
        id: 'a1',
        severity: 'high',
        title: 'Bericht überfällig – Familie Müller',
        description:
            'Termin vom 20.05. wurde noch nicht dokumentiert. Fachkraft: Anna Berger.',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
        id: 'a2',
        severity: 'high',
        title: '2 Berichte überfällig – Markus Lehner',
        description: 'Termine vom 19.05. und 21.05. ohne Dokumentation.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 'a3',
        severity: 'med',
        title: 'Auslastung überschritten – Markus Lehner',
        description:
            'Wochenquote um 8% überschritten. Ggf. Klient neu zuweisen.',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
        id: 'a4',
        severity: 'med',
        title: 'HilfePlan abgelaufen – Familie Fischer',
        description:
            'HilfePlan v2 ist seit 14 Tagen nicht aktualisiert worden.',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
        id: 'a5',
        severity: 'low',
        title: 'Neue Fachkraft eingeladen',
        description: 'Tobias Huber hat sein Passwort noch nicht gesetzt.',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
];

// ─── KPI-Berechnungen ─────────────────────────────────────────────────────────

function getKWString(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const kw = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `KW ${kw} · ${now.getFullYear()}`;
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

// ─── Page ─────────────────────────────────────────────────────────────────────

interface AdminDashboardProps {
    onNavigate: (pageKey: string, clientId?: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
    const [workload] = useState<FachkraftWorkload[]>(MOCK_WORKLOAD);
    const [clients] = useState<Client[]>(MOCK_CLIENTS);
    const [fachkraefte] = useState<Fachkraft[]>(MOCK_FACHKRAEFTE);
    const [alerts] = useState<AdminAlert[]>(MOCK_ALERTS);

    const activeClients = clients.filter((c) => c.status === 'aktiv').length;
    const totalAppointments = workload.reduce(
        (s, fk) => s + fk.appointmentsThisWeek,
        0,
    );
    const totalOverdue = workload.reduce((s, fk) => s + fk.overdueReports, 0);
    const utilPct = avgUtilization(workload);

    return (
        <div className="px-8 pt-7 pb-16 max-w-[1280px] mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-[24px] font-[600] text-text tracking-[-0.02em]">
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
                    onAction={() => onNavigate('admin-fachkraefte')}
                />
                <WorkloadTable
                    data={workload}
                    onRowClick={(id) => onNavigate('admin-fachkraefte')}
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
                    onClientClick={(id) => onNavigate('client-detail', id)}
                />

                {/* Alerts */}
                <AlertsPanel alerts={alerts} />
            </div>
        </div>
    );
}
