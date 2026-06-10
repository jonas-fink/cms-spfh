// Stabile Farbzuweisung pro userId für Team-View.

const PALETTE = [
    { bg: 'bg-blue-500/15', text: 'text-blue-700', dot: 'bg-blue-500' },
    { bg: 'bg-emerald-500/15', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    { bg: 'bg-amber-500/15', text: 'text-amber-700', dot: 'bg-amber-500' },
    { bg: 'bg-violet-500/15', text: 'text-violet-700', dot: 'bg-violet-500' },
    { bg: 'bg-rose-500/15', text: 'text-rose-700', dot: 'bg-rose-500' },
    { bg: 'bg-cyan-500/15', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    { bg: 'bg-orange-500/15', text: 'text-orange-700', dot: 'bg-orange-500' },
    { bg: 'bg-lime-500/15', text: 'text-lime-700', dot: 'bg-lime-500' },
];

function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

export function colorForUserId(userId: string) {
    return PALETTE[hash(userId) % PALETTE.length];
}

export const TYPE_LABELS: Record<string, string> = {
    team_meeting: 'Team-Meeting',
    koordination: 'Koordination',
    sonstiges: 'Sonstiges',
    urlaub: 'Urlaub',
    krank: 'Krank',
};
