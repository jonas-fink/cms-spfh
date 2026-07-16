import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Icon from './Icon';
import NotificationBell from './NotificationBell';
import ClockInWidget from './ClockInWidget';
import { api } from '../../utils/api';
import type { Client } from '../../types';

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
    const [query, setQuery] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const loadedRef = useRef(false);
    const navigate = useNavigate();

    // Klienten einmalig beim ersten Fokus laden (Backend filtert nach Rolle).
    async function loadClients() {
        if (loadedRef.current) return;
        loadedRef.current = true;
        try {
            setClients(await api.get<Client[]>('/clients'));
        } catch {
            loadedRef.current = false; // erneuter Versuch beim nächsten Fokus
        }
    }

    const q = query.trim().toLowerCase();
    const matches = q
        ? clients
              .filter(
                  (c) =>
                      c.familyName.toLowerCase().includes(q) ||
                      (c.caseNumber ?? '').toLowerCase().includes(q),
              )
              .slice(0, 8)
        : [];

    function openClient(id: string) {
        navigate(role === 'admin' ? `/admin/clients/${id}` : `/clients/${id}`);
        setQuery('');
        setFocused(false);
    }

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
                    placeholder="Klient, Fall, Aktenzeichen…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        setFocused(true);
                        loadClients();
                    }}
                    onBlur={() => setTimeout(() => setFocused(false), 150)}
                    className={`
            w-full h-7.5 pl-8 pr-3 rounded-md text-[12.5px] text-text
            bg-surface border transition-colors duration-100 outline-none font-sans
            placeholder:text-muted
            ${focused ? 'border-border-strong bg-bg' : 'border-border'}
          `}
                />
                {focused && q && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-surface border border-border rounded-md shadow-lg overflow-hidden z-50">
                        {matches.length === 0 ? (
                            <div className="px-3 py-2 text-[12px] text-muted">
                                Keine Treffer
                            </div>
                        ) : (
                            matches.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => openClient(c.id)}
                                    className="w-full text-left px-3 py-2 text-[12.5px] text-text hover:bg-surface-hover flex items-center justify-between gap-2"
                                >
                                    <span className="truncate">
                                        Familie {c.familyName}
                                    </span>
                                    {c.caseNumber && (
                                        <span className="text-[11px] text-muted shrink-0">
                                            {c.caseNumber}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Zeiterfassung (nur Fachkraft) */}
            {role === 'fachkraft' && <ClockInWidget />}

            {/* Bell */}
            <NotificationBell />
        </header>
    );
}
