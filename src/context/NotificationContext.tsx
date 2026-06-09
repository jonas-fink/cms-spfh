import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from './auth';
import { NotificationContext } from './notifications';
import type { Notification } from '../types';

const POLL_INTERVAL_MS = 30_000;

export const NotificationProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [recent, setRecent] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const timerRef = useRef<number | null>(null);

    const refresh = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [list, countRes] = await Promise.all([
                api.get<Notification[]>('/notifications?limit=10'),
                api.get<{ count: number }>('/notifications/unread-count'),
            ]);
            setRecent(list);
            setUnreadCount(countRes.count);
        } catch {
            // silent: polling failures should not break UI
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            setRecent([]);
            return;
        }
        refresh();
        timerRef.current = window.setInterval(refresh, POLL_INTERVAL_MS);
        return () => {
            if (timerRef.current !== null) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [user, refresh]);

    const markRead = useCallback(async (id: string) => {
        await api.patch<Notification>(`/notifications/${id}/read`);
        setRecent((prev) =>
            prev.map((n) =>
                n._id === id || n.id === id
                    ? { ...n, read: true, readAt: new Date().toISOString() }
                    : n,
            ),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
    }, []);

    const markAllRead = useCallback(async () => {
        await api.patch<{ modified: number }>('/notifications/read-all');
        setRecent((prev) =>
            prev.map((n) => ({
                ...n,
                read: true,
                readAt: n.readAt ?? new Date().toISOString(),
            })),
        );
        setUnreadCount(0);
    }, []);

    const remove = useCallback(async (id: string) => {
        await api.delete(`/notifications/${id}`);
        setRecent((prev) => prev.filter((n) => n._id !== id && n.id !== id));
        // unread count may need refresh; refresh in background
        api.get<{ count: number }>('/notifications/unread-count')
            .then((r) => setUnreadCount(r.count))
            .catch(() => {});
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                unreadCount,
                recent,
                loading,
                refresh,
                markRead,
                markAllRead,
                remove,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
