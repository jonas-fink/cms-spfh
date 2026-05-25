import { Icon, Card, SectionHeader } from '../shared';
import { formatDate } from '../../utils/format';
import type { VerlaufEntry } from '../../types';

interface TabVerlaufProps {
    verlauf: VerlaufEntry[];
}

const VERLAUF_CONFIG: Record<
    VerlaufEntry['type'],
    { icon: 'calendar' | 'file' | 'target' | 'chat'; color: string }
> = {
    termin: { icon: 'calendar', color: 'var(--accent)' },
    dokument: { icon: 'file', color: '#0ea5e9' },
    hilfeplan: { icon: 'target', color: '#10b981' },
    notiz: { icon: 'chat', color: '#f59e0b' },
};

export function TabVerlauf({ verlauf }: TabVerlaufProps) {
    return (
        <Card>
            <div className="px-5 py-3.5 border-b border-border">
                <SectionHeader
                    title="Aktivitätsverlauf"
                    sub={`${verlauf.length} Einträge`}
                />
            </div>
            <div className="p-5 flex flex-col">
                {verlauf.map((entry, i) => {
                    const cfg = VERLAUF_CONFIG[entry.type];
                    const isLast = i === verlauf.length - 1;
                    return (
                        <div
                            key={entry.id}
                            className={`flex gap-3.5 relative ${!isLast ? 'pb-5' : ''}`}
                        >
                            {!isLast && (
                                <div className="absolute left-[14px] top-7 bottom-0 w-px bg-border" />
                            )}
                            {/* color ist datenseitig → inline */}
                            <div
                                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ background: `${cfg.color}18` }}
                            >
                                <Icon
                                    name={cfg.icon}
                                    size={14}
                                    stroke={1.75}
                                    color={cfg.color}
                                />
                            </div>
                            <div className="flex-1 pt-1">
                                <div className="flex justify-between items-start mb-0.5">
                                    <span className="text-[13px] font-medium text-text">
                                        {entry.title}
                                    </span>
                                    <span className="text-[11.5px] text-muted shrink-0 ml-3">
                                        {formatDate(entry.date, {
                                            dateOnly: true,
                                        })}
                                    </span>
                                </div>
                                {entry.sub && (
                                    <div className="text-xs text-muted">
                                        {entry.sub}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
