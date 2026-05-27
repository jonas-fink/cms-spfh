import { SectionHeader } from '../shared';
import { ClientCard } from '../client';
import type { Client } from '../../types';

interface ClientsGridProps {
    clients: Client[];
    activeCount: number;
    onClientClick: (id: string) => void;
    onShowAll: () => void;
}

const ClientsGrid = ({
    clients,
    activeCount,
    onClientClick,
    onShowAll,
}: ClientsGridProps) => {
    const hasOverflow = clients.length > 4;

    return (
        <section>
            <SectionHeader
                title="Meine Klienten"
                sub={`${activeCount} aktiv · ${clients.length} gesamt`}
                action={hasOverflow ? 'Alle anzeigen' : undefined}
                onAction={hasOverflow ? onShowAll : undefined}
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
                            onClick={() => onClientClick(client.id)}
                        />
                    ))}
                </div>
            )}
        </section>
    );
};

export default ClientsGrid;
