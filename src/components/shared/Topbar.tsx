import { useState } from 'react';
import { Link } from 'react-router';
import Icon from './Icon';
import NotificationBell from './NotificationBell';
import ClockInWidget from './ClockInWidget';

interface Breadcrumb {
    label: string;
    path?: string;
}

interface TopbarProps {
    breadcrumbs: Breadcrumb[];
    role?: 'fachkraft' | 'admin';
    onNavigate?: (path: string) => void;
}

export default function Topbar({ breadcrumbs, role }: TopbarProps) {
    const [focused, setFocused] = useState(false);

    return (
        <header className="h-14 sticky top-0 z-50 flex items-center px-6 gap-4 border-b border-border backdrop-blur-md bg-bg/85">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                        {i > 0 && (
                            <Icon
                                name="chevronRight"
                                size={13}
                                color="var(--text-mute)"
                            />
                        )}
                        {crumb.path ? (
                            <Link
                                to={crumb.path}
                                className="text-[13px] text-muted hover:text-text transition-colors no-underline"
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span className="text-[13px] font-semibold text-text tracking-[-0.01em] truncate">
                                {crumb.label}
                            </span>
                        )}
                    </span>
                ))}
            </div>

            {/* Search */}
            <div className="relative w-70 shrink-0">
                <Icon
                    name="search"
                    size={14}
                    color="var(--text-mute)"
                    style={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                    }}
                />
                <input
                    type="text"
                    placeholder="Klient, Fall, Aktenzeichen… ⌘K"
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`
            w-full h-7.5 pl-8 pr-3 rounded-md text-[12.5px] text-text
            bg-surface border transition-colors duration-100 outline-none font-sans
            placeholder:text-muted
            ${focused ? 'border-border-strong bg-bg' : 'border-border'}
          `}
                />
            </div>

            {/* Zeiterfassung (nur Fachkraft) */}
            {role === 'fachkraft' && <ClockInWidget />}

            {/* Bell */}
            <NotificationBell />
        </header>
    );
}
