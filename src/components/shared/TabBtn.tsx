interface TabBtnProps {
    label: string;
    active: boolean;
    count?: number;
    onClick: () => void;
}

export function TabBtn({ label, active, count, onClick }: TabBtnProps) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-0.5 pb-3 bg-transparent border-0 border-b-2 -mb-px cursor-pointer transition-colors duration-100 text-[13.5px] ${
                active
                    ? 'font-medium text-text border-text'
                    : 'font-normal text-muted border-transparent'
            }`}
        >
            {label}
            {count !== undefined && (
                <span
                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                        active
                            ? 'bg-text text-bg'
                            : 'bg-surface-hover text-muted'
                    }`}
                >
                    {count}
                </span>
            )}
        </button>
    );
}
