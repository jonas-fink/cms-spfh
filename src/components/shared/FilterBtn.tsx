interface FilterBtnProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

export function FilterBtn({ label, active, onClick }: FilterBtnProps) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1 text-[12.5px] font-medium rounded-md border cursor-pointer transition-all duration-100 ${
                active
                    ? 'bg-text text-bg border-text'
                    : 'bg-surface text-muted border-border'
            }`}
        >
            {label}
        </button>
    );
}
