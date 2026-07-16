import { KPICard } from '../shared';

interface KPIStripProps {
    activeClients: number;
    totalClients: number;
    stundenValue: string;
    weekCounts: { durchgefuehrt: number; geplant: number };
    openGoals: number;
}

const KPIStrip = ({
    activeClients,
    totalClients,
    stundenValue,
    weekCounts,
    openGoals,
}: KPIStripProps) => (
    <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
        <KPICard
            label="Aktive Klienten"
            value={String(activeClients)}
            sub={`${totalClients} gesamt`}
        />
        <KPICard
            label="Stunden KW"
            value={stundenValue}
            sub={`${weekCounts.durchgefuehrt} Termine`}
        />
        <KPICard
            label="Termine KW"
            value={String(weekCounts.geplant + weekCounts.durchgefuehrt)}
            sub={`${weekCounts.geplant} noch offen`}
        />
        <KPICard
            label="Offene Aufgaben"
            value={String(openGoals)}
            sub="aus Hilfeplänen"
        />
    </div>
);

export default KPIStrip;
