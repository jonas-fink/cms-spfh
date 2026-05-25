import Icon from './Icon';

interface GoalCheckProps {
    goal: string;
    status: 'offen' | 'in Bearbeitung' | 'erreicht';
    onStatusChange?: (next: 'offen' | 'in Bearbeitung' | 'erreicht') => void;
    readonly?: boolean;
}

const STATUS_CONFIG = {
    offen: {
        color: '#64748b',
        bg: 'rgba(148,163,184,0.15)',
        icon: null,
    },
    'in Bearbeitung': {
        color: '#b45309',
        bg: 'rgba(245,158,11,0.12)',
        icon: 'clock' as const,
    },
    erreicht: {
        color: '#059669',
        bg: 'rgba(16,185,129,0.12)',
        icon: 'check' as const,
    },
} satisfies Record<
    string,
    { color: string; bg: string; icon: 'clock' | 'check' | null }
>;

const STATUS_CYCLE: Record<
    'offen' | 'in Bearbeitung' | 'erreicht',
    'offen' | 'in Bearbeitung' | 'erreicht'
> = {
    offen: 'in Bearbeitung',
    'in Bearbeitung': 'erreicht',
    erreicht: 'offen',
};

const GoalCheck = ({
    goal,
    status,
    onStatusChange,
    readonly = false,
}: GoalCheckProps) => {
    const cfg = STATUS_CONFIG[status];

    const handleClick = () => {
        if (readonly || !onStatusChange) return;
        onStatusChange(STATUS_CYCLE[status]);
    };
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0">
            {/* Checkbox — border/bg sind status-abhängige Datenwerte → inline */}
            <button
                onClick={handleClick}
                disabled={readonly}
                className={`shrink-0 mt-0.5 w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all duration-100 ${
                    readonly ? 'cursor-default' : 'cursor-pointer'
                }`}
                style={{
                    border: `1.5px solid ${cfg.color}`,
                    background: status !== 'offen' ? cfg.bg : 'transparent',
                }}
            >
                {cfg.icon && (
                    <Icon
                        name={cfg.icon}
                        size={11}
                        stroke={2.5}
                        color={cfg.color}
                    />
                )}
            </button>

            <p
                className={`flex-1 text-[13px] leading-[1.5] m-0 ${
                    status === 'erreicht'
                        ? 'text-muted line-through'
                        : 'text-text'
                }`}
            >
                {goal}
            </p>

            {/* Badge — color/bg sind status-abhängige Datenwerte → inline */}
            <span
                className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded whitespace-nowrap"
                style={{ color: cfg.color, background: cfg.bg }}
            >
                {status}
            </span>
        </div>
    );
};

export default GoalCheck;
