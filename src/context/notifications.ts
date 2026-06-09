import { createContext, useContext } from 'react';
import type { Notification } from '../types';

export interface NotificationContextValue {
    unreadCount: number;
    recent: Notification[];
    loading: boolean;
    refresh: () => Promise<void>;
    markRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    remove: (id: string) => Promise<void>;
}

export const NotificationContext =
    createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
    const ctx = useContext(NotificationContext);
    if (!ctx)
        throw new Error(
            'useNotifications muss innerhalb von <NotificationProvider> verwendet werden',
        );
    return ctx;
}
