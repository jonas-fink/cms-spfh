import { Avatar, StatusPill } from '../shared';
import type { Client, Fachkraft } from '../../types';

interface ClientDistributionProps {
    clients: Client[];
    fachkraefte: Fachkraft[];
    onClientClick?: (id: string) => void;
}

const ClientDistribution = ({
    clients,
    fachkraefte,
    onClientClick,
}: ClientDistributionProps) => {
    const fkMap = new Map(fachkraefte.map((f) => [f.id, f]));
    return (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text tracking-[-0.01em]">
                    Klienten-Verteilung
                </span>
                <span className="text-[11.5px] text-muted">
                    {clients.length} Fälle gesamt
                </span>
            </div>

            {/* List */}
            <div className="divide-y divide-border">
                {clients.map((client) => {
                    const assignedFKs = client.assignedFachkraefte
                        .map((id) => fkMap.get(id))
                        .filter(Boolean) as Fachkraft[];

                    const isTandem = assignedFKs.length > 1;

                    return (
                        <div
                            key={client.id}
                            className={[
                                'flex items-center gap-3 px-4 py-2.5 transition-colors duration-100',
                                onClientClick
                                    ? 'cursor-pointer hover:bg-surface-hover'
                                    : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            onClick={() => onClientClick?.(client.id)}
                        >
                            {/* Familienname + Aktenzeichen */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-[450] text-text truncate">
                                        {client.familyName}
                                    </span>
                                    {isTandem && (
                                        <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded-full bg-accent/10 text-accent shrink-0">
                                            Tandem
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11.5px] text-muted">
                                    {client.caseNumber}
                                </span>
                            </div>

                            {/* Status */}
                            <StatusPill status={client.status} size="sm" />

                            {/* FK Avatare */}
                            <div className="flex items-center">
                                {assignedFKs.map((fk, idx) => (
                                    <div
                                        key={fk.id}
                                        className="rounded-full border-2 border-surface"
                                        style={{
                                            marginLeft: idx > 0 ? '-8px' : 0,
                                            zIndex: assignedFKs.length - idx,
                                        }}
                                    >
                                        <Avatar
                                            name={`${fk.firstName} ${fk.lastName}`}
                                            size={24}
                                        />
                                    </div>
                                ))}
                                {assignedFKs.length === 0 && (
                                    <span className="text-[11.5px] text-muted italic">
                                        Nicht zugewiesen
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {clients.length === 0 && (
                <div className="px-4 py-10 text-center text-[13px] text-muted">
                    Keine aktiven Klienten.
                </div>
            )}
        </div>
    );
};

export default ClientDistribution;
