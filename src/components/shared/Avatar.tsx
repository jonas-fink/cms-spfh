interface AvatarProps {
    name: string;
    size?: number;
    color?: string;
}

function hashColor(name: string): string {
    const palette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
}

function initials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

export default function Avatar({ name, size = 28, color }: AvatarProps) {
    const bg = color ?? hashColor(name);
    return (
        <div
            aria-label={name}
            className="rounded-full flex items-center justify-center shrink-0 select-none font-semibold text-white"
            style={{
                width: size,
                height: size,
                background: bg,
                fontSize: Math.round(size * 0.38),
            }}
        >
            {initials(name)}
        </div>
    );
}
