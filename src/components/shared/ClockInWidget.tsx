import { useState } from 'react';
import Icon from './Icon';
import { useClockSession } from '../../hooks/useClockSession';
import { formatMinutes } from '../../utils/format';

export default function ClockInWidget() {
    const {
        session,
        loading,
        onBreak,
        workedMinutes,
        clockIn,
        clockOut,
        toggleBreak,
    } = useClockSession();
    const [busy, setBusy] = useState(false);

    async function run(fn: () => Promise<void>) {
        setBusy(true);
        try {
            await fn();
        } finally {
            setBusy(false);
        }
    }

    if (loading) return null;

    if (!session) {
        return (
            <button
                type="button"
                disabled={busy}
                onClick={() => run(clockIn)}
                className="flex items-center gap-1.5 h-7.5 px-3 rounded-md text-[12.5px] font-medium bg-accent text-white hover:brightness-95 transition disabled:opacity-60"
            >
                <Icon name="clock" size={14} color="#fff" /> Einstempeln
            </button>
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <span
                className={`flex items-center gap-1.5 h-7.5 px-2.5 rounded-md text-[12.5px] font-medium tabular-nums border ${
                    onBreak
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                }`}
            >
                <span
                    className={`w-1.5 h-1.5 rounded-full ${
                        onBreak ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                />
                {onBreak ? 'Pause' : formatMinutes(workedMinutes)}
            </span>
            <button
                type="button"
                disabled={busy}
                onClick={() => run(toggleBreak)}
                className="h-7.5 px-2.5 rounded-md text-[12.5px] font-medium bg-surface border border-border text-muted hover:text-text hover:border-border-strong transition disabled:opacity-60"
            >
                {onBreak ? 'Weiter' : 'Pause'}
            </button>
            <button
                type="button"
                disabled={busy}
                onClick={() => run(clockOut)}
                className="h-7.5 px-2.5 rounded-md text-[12.5px] font-medium bg-surface border border-border text-muted hover:text-text hover:border-border-strong transition disabled:opacity-60"
            >
                Ausstempeln
            </button>
        </div>
    );
}
