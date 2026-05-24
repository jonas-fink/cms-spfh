import React from 'react';

export type StatusValue =
    | 'aktiv'
    | 'pausiert'
    | 'abgeschlossen'
    | 'geplant'
    | 'durchgeführt'
    | 'ausgefallen'
    | 'offen'
    | 'in Bearbeitung'
    | 'erreicht';

interface StatusPillProps {
    status: StatusValue;
    size?: 'sm' | 'md';
}

const statusStyles: Record<StatusValue, string> = {
    aktiv: 'bg-accent/10 text-accent',
    pausiert: 'bg-slate-400/15 text-slate-500',
    abgeschlossen: 'bg-slate-400/10 text-slate-400',
    geplant: 'bg-indigo-500/10 text-indigo-500',
    durchgeführt: 'bg-emerald-500/12 text-emerald-600',
    ausgefallen: 'bg-red-500/10 text-red-600',
    offen: 'bg-slate-400/15 text-slate-500',
    'in Bearbeitung': 'bg-amber-500/12 text-amber-700',
    erreicht: 'bg-emerald-500/12 text-emerald-600',
};

export default function StatusPill({ status, size = 'sm' }: StatusPillProps) {
    return (
        <span
            className={`
      inline-flex items-center rounded-full font-medium whitespace-nowrap
      ${size === 'sm' ? 'text-[11px] px-[7px] py-[2px]' : 'text-[12px] px-[9px] py-[3px]'}
      ${statusStyles[status] ?? 'bg-slate-400/15 text-slate-500'}
    `}
        >
            {status}
        </span>
    );
}
