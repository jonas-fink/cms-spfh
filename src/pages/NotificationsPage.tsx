import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../utils/api';
import { useNotifications } from '../context/notifications';
import { FilterBtn, Icon, SectionHeader } from '../components/shared';
import { formatRelativeShort } from '../utils/format';
import type { Notification } from '../types';

type ReadFilter = 'alle' | 'ungelesen' | 'gelesen';

export default function NotificationsPage() {
    const { refresh, markRead, markAllRead, remove } = useNotifications();
    const navigate = useNavigate();
    const [items, setItems] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<ReadFilter>('alle');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const qs =
            filter === 'ungelesen'
                ? '?read=false&limit=100'
                : filter === 'gelesen'
                  ? '?read=true&limit=100'
                  : '?limit=100';
        api.get<Notification[]>(`/notifications${qs}`)
            .then((list) => {
                if (!cancelled) setItems(list);
            })
            .catch((e: Error) => {
                if (!cancelled) setError(e.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [filter, reloadKey]);

    const reload = () => {
        setReloadKey((k) => k + 1);
        refresh();
    };

    const handleClick = async (n: Notification) => {
        const id = n._id ?? n.id!;
        if (!n.read) {
            await markRead(id);
            setItems((prev) =>
                prev.map((x) =>
                    (x._id ?? x.id) === id
                        ? { ...x, read: true, readAt: new Date().toISOString() }
                        : x,
                ),
            );
        }
        if (n.link) navigate(n.link);
    };

    const handleDelete = async (
        e: React.MouseEvent,
        id: string,
    ): Promise<void> => {
        e.stopPropagation();
        await remove(id);
        setItems((prev) => prev.filter((x) => (x._id ?? x.id) !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
                <SectionHeader
                    title="Benachrichtigungen"
                    sub="Alle System-Meldungen, Termin-Einladungen und Anträge."
                />
                <button
                    onClick={async () => {
                        await markAllRead();
                        reload();
                    }}
                    className="text-[12.5px] text-muted hover:text-text"
                >
                    Alle als gelesen
                </button>
            </div>

            <div className="flex items-center gap-1.5">
                <FilterBtn
                    label="Alle"
                    active={filter === 'alle'}
                    onClick={() => setFilter('alle')}
                />
                <FilterBtn
                    label="Ungelesen"
                    active={filter === 'ungelesen'}
                    onClick={() => setFilter('ungelesen')}
                />
                <FilterBtn
                    label="Gelesen"
                    active={filter === 'gelesen'}
                    onClick={() => setFilter('gelesen')}
                />
            </div>

            {error && (
                <p className="text-[13px] text-red-500 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                    {error}
                </p>
            )}

            {loading ? (
                <p className="text-[13px] text-muted">Lade…</p>
            ) : items.length === 0 ? (
                <p className="text-[13px] text-muted">
                    Keine Benachrichtigungen.
                </p>
            ) : (
                <ul className="border border-border rounded-md bg-surface overflow-hidden">
                    {items.map((n) => {
                        const id = n._id ?? n.id!;
                        return (
                            <li
                                key={id}
                                onClick={() => handleClick(n)}
                                className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-surface-hover transition-colors ${
                                    n.read ? '' : 'bg-surface-hover/40'
                                }`}
                            >
                                <span
                                    className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                        n.read ? 'bg-transparent' : 'bg-accent'
                                    }`}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium text-text m-0">
                                        {n.title}
                                    </p>
                                    <p className="text-[12.5px] text-muted m-0 mt-0.5">
                                        {n.message}
                                    </p>
                                    <p className="text-[11.5px] text-muted m-0 mt-1 tabular-nums">
                                        {formatRelativeShort(n.createdAt)}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, id)}
                                    className="text-muted hover:text-text p-1 rounded-md transition-colors"
                                    title="Löschen"
                                >
                                    <Icon name="trash" size={14} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
