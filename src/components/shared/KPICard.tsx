import Icon from './Icon';
import Card from './Card';

interface KPICardProps {
    label: string;
    value: string | number;
    sub?: string;
    trend?: string;
    trendPositive?: boolean;
    trendNegative?: boolean;
    warning?: boolean;
    className?: string;
}

export default function KPICard({
    label,
    value,
    sub,
    trend,
    trendPositive,
    trendNegative,
    warning,
    className,
}: KPICardProps) {
    const trendColor = trendPositive
        ? 'text-emerald-600'
        : trendNegative
          ? 'text-red-600'
          : warning
            ? 'text-amber-700'
            : 'text-muted';

    return (
        <Card padding="px-5 py-4" className={className}>
            <p className="text-[11.5px] text-muted mb-1.5">{label}</p>

            <p className="text-[24px] font-semibold text-text tracking-[-0.02em] tabular-nums leading-none">
                {value}
            </p>

            {sub && <p className="text-[11.5px] text-muted mt-1">{sub}</p>}

            {trend && (
                <div
                    className={`flex items-center gap-1 mt-1.5 text-[11.5px] font-medium ${trendColor}`}
                >
                    {trendPositive && <Icon name="arrowUp" size={12} />}
                    {trendNegative && <Icon name="arrowDown" size={12} />}
                    {warning && <Icon name="alert" size={12} />}
                    <span>{trend}</span>
                </div>
            )}
        </Card>
    );
}
