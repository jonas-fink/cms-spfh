export const FK_COLORS = [
    '#6366f1',
    '#0ea5e9',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
] as const;

export function pickFkColor(idx: number): string {
    return FK_COLORS[idx % FK_COLORS.length];
}
