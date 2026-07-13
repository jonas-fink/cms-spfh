import Button from './Button';

interface SectionHeaderProps {
    title: string;
    sub?: string;
    action?: string;
    onAction?: () => void;
    className?: string;
}

export default function SectionHeader({
    title,
    sub,
    action,
    onAction,
    className = '',
}: SectionHeaderProps) {
    return (
        <div
            className={`flex items-baseline justify-between gap-3 ${className}`}
        >
            <div>
                <h2 className="text-[15px] font-semibold text-text tracking-[-0.01em] m-0">
                    {title}
                </h2>
                {sub && (
                    <p className="text-[11.5px] text-muted mt-0.5 m-0">{sub}</p>
                )}
            </div>
            {action && onAction && (
                <Button
                    variant="ghost"
                    size="sm"
                    iconRight="arrowRight"
                    onClick={onAction}
                >
                    {action}
                </Button>
            )}
        </div>
    );
}
