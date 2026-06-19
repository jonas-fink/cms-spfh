import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';
import type { Notification } from '../types';

const POLL_INTERVAL_MS = 30_000;

interface NotificationContextValue {
    unreadCount: number;
    recent: Notification[];
    loading: boolean;
    refresh: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    remove: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications muss innerhalb von <NotificationProvider> verwendet werden');
    return ctx;
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
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
        if (!user) { setUnreadCount(0); setRecent([]); return; }
        refresh();
        timerRef.current = window.setInterval(refresh, POLL_INTERVAL_MS);
        return () => {
            if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; }
        };
    }, [user, refresh]);

    const markRead = useCallback(async (id: string) => {
        await api.patch<Notification>(`/notifications/${id}/read`);
        setRecent((prev) => prev.map((n) => n._id === id || n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
    }, []);

    const markAllRead = useCallback(async () => {
        await api.patch<{ modified: number }>('/notifications/read-all');
        setRecent((prev) => prev.map((n) => ({ ...n, read: true, readAt: n.readAt ?? new Date().toISOString() })));
        setUnreadCount(0);
    }, []);

    const remove = useCallback(async (id: string) => {
        await api.delete(`/notifications/${id}`);
        setRecent((prev) => prev.filter((n) => n._id !== id && n.id !== id));
        api.get<{ count: number }>('/notifications/unread-count')
            .then((r) => setUnreadCount(r.count))
            .catch(() => {});
    }, []);

    return (
        <NotificationContext.Provider value={{ unreadCount, recent, loading, refresh, markRead, markAllRead, remove }}>
            {children}
        </NotificationContext.Provider>
    );
};
