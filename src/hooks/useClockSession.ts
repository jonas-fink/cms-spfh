import { useCallback, useEffect, useState } from 'react';
import type { ApiWorkSession } from '../types';
import { api } from '../utils/api';

/** Live-Timer + Aktionen für die aktuelle (offene) Arbeitssitzung des Users. */
export function useClockSession() {
    const [session, setSession] = useState<ApiWorkSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(() => Date.now());

    const refresh = useCallback(async () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        try {
            const list = await api.get<ApiWorkSession[]>(
                `/work-sessions/me?from=${start.toISOString()}&to=${end.toISOString()}`,
            );
            setSession(list.find((s) => !s.clockOut) ?? null);
        } catch {
            setSession(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // 1s-Tick nur wenn eine Session offen ist
    useEffect(() => {
        if (!session) return;
        const iv = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(iv);
    }, [session]);

    const onBreak = session?.breaks.some((b) => !b.end) ?? false;

    // gearbeitete Minuten live = (jetzt − clockIn) − abgeschlossene Pausen
    // − laufende Pause
    let workedMinutes = 0;
    if (session) {
        const grossMs = now - new Date(session.clockIn).getTime();
        let breakMs = 0;
        for (const b of session.breaks) {
            const bEnd = b.end ? new Date(b.end).getTime() : now;
            breakMs += bEnd - new Date(b.start).getTime();
        }
        workedMinutes = Math.max(0, Math.floor((grossMs - breakMs) / 60_000));
    }

    async function clockIn() {
        await api.post('/work-sessions/clock-in');
        await refresh();
    }
    async function clockOut() {
        if (!session) return;
        await api.patch(`/work-sessions/${session._id}/clock-out`);
        await refresh();
    }
    async function toggleBreak() {
        if (!session) return;
        await api.post(
            `/work-sessions/${session._id}/${onBreak ? 'break-end' : 'break-start'}`,
        );
        await refresh();
    }

    return {
        session,
        loading,
        onBreak,
        workedMinutes,
        clockIn,
        clockOut,
        toggleBreak,
        refresh,
    };
}
