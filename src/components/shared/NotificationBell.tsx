import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import Icon from './Icon';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import type { Notification } from '../../types';
import { formatRelativeShort } from '../../utils/format';

export default function NotificationBell() {
    const { unreadCount, recent, markRead, markAllRead } = useNotifications();
    const { user } = useAuth();
    const allPath =
        user?.role === 'admin' ? '/admin/notifications' : '/notifications';
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleClick = async (n: Notification) => {
        const id = n._id ?? n.id!;
        if (!n.read) await markRead(id);
        setOpen(false);
        if (n.link) navigate(n.link);
    };

    return (
        <div className="relative" ref={wrapRef}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative text-muted hover:text-text p-1.5 rounded-md transition-colors cursor-pointer"
                aria-label="Benachrichtigungen"
            >
                <Icon name="bell" size={17} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-1.75 h-1.75 rounded-full bg-orange-500 border-[1.5px] border-bg" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-md shadow-lg overflow-hidden z-50">
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
                        <span className="text-[13px] font-semibold text-text">
                            Benachrichtigungen
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[11.5px] text-muted hover:text-text"
                            >
                                Alle als gelesen
                            </button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {recent.length === 0 ? (
                            <p className="px-3.5 py-6 text-[12.5px] text-muted text-center">
                                Keine Benachrichtigungen
                            </p>
                        ) : (
                            recent.map((n) => {
                                const id = n._id ?? n.id!;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => handleClick(n)}
                                        className={`w-full text-left px-3.5 py-2.5 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors flex gap-2.5 ${
                                            n.read ? '' : 'bg-surface-hover/50'
                                        }`}
                                    >
                                        <span
                                            className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                                n.read
                                                    ? 'bg-transparent'
                                                    : 'bg-accent'
                                            }`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12.5px] font-medium text-text m-0 truncate">
                                                {n.title}
                                            </p>
                                            <p className="text-[12px] text-muted m-0 line-clamp-2">
                                                {n.message}
                                            </p>
                                            <p className="text-[11px] text-muted m-0 mt-1 tabular-nums">
                                                {formatRelativeShort(
                                                    n.createdAt,
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <div className="px-3.5 py-2 border-t border-border">
                        <button
                            onClick={() => {
                                setOpen(false);
                                navigate(allPath);
                            }}
                            className="text-[12px] text-accent hover:underline"
                        >
                            Alle ansehen
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
