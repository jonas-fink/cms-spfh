import { Icon } from '../shared';

type Severity = 'high' | 'med' | 'low';

export interface AdminAlert {
    id: string;
    severity: Severity;
    title: string;
    description: string;
    createdAt: string;
}

interface AlertsPanelProps {
    alerts: AdminAlert[];
}

const SEVERITY_CONFIG: Record<
    Severity,
    { bg: string; iconColor: string; dot: string; label: string }
> = {
    high: {
        bg: 'bg-[#dc2626]/8',
        iconColor: '#dc2626',
        dot: 'bg-[#dc2626]',
        label: 'Dringend',
    },
    med: {
        bg: 'bg-[#f59e0b]/8',
        iconColor: '#b45309',
        dot: 'bg-[#f59e0b]',
        label: 'Hinweis',
    },
    low: {
        bg: 'bg-surface-hover',
        iconColor: '#94a3b8',
        dot: 'bg-[#94a3b8]',
        label: 'Info',
    },
};

function formatRelative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days >= 1) return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
    if (hours >= 1) return `vor ${hours} Std.`;
    return 'Gerade eben';
}

const AlertsPanel = ({ alerts }: AlertsPanelProps) => {
    return (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-[13px] font-semibold text-text tracking-[-0.01em]">
                    Hinweise
                </span>
                {alerts.filter((a) => a.severity === 'high').length > 0 && (
                    <span className="text-[11.5px] font-medium text-[#dc2626]">
                        {alerts.filter((a) => a.severity === 'high').length}{' '}
                        dringend
                    </span>
                )}
            </div>

            {/* Alert Items */}
            <div className="divide-y divide-border">
                {alerts.slice(0, 5).map((alert) => {
                    const cfg = SEVERITY_CONFIG[alert.severity];
                    return (
                        <div
                            key={alert.id}
                            className={['flex gap-3 px-4 py-3', cfg.bg].join(
                                ' ',
                            )}
                        >
                            {/* Severity dot */}
                            <div className="pt-1.25 shrink-0">
                                <div
                                    className={[
                                        'w-1.5 h-1.5 rounded-full',
                                        cfg.dot,
                                    ].join(' ')}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-[13px] font-[450] text-text">
                                        {alert.title}
                                    </span>
                                    <span className="text-[11px] text-muted shrink-0 pt-px">
                                        {formatRelative(alert.createdAt)}
                                    </span>
                                </div>
                                <p className="text-[12px] text-muted mt-0.5 leading-relaxed">
                                    {alert.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {alerts.length === 0 && (
                <div className="px-4 py-10 text-center">
                    <div className="flex justify-center mb-2">
                        <Icon name="check" size={20} stroke={1.5} />
                    </div>
                    <p className="text-[13px] text-muted">
                        Keine offenen Hinweise.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AlertsPanel;
