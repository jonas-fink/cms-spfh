import { KPICard } from '../shared';

interface KPIStripProps {
    activeClients: number;
    totalClients: number;
    stundenValue: string;
    weekCounts: { durchgefuehrt: number; geplant: number };
}

const KPIStrip = ({
    activeClients,
    totalClients,
    stundenValue,
    weekCounts,
}: KPIStripProps) => (
    <div
        className="grid gap-3.5"
        style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
    >
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
        <KPICard label="Offene Aufgaben" value="–" sub="aus Hilfeplänen" />
    </div>
);

export default KPIStrip;
