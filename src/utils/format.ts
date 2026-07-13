// Datums & Zeitformatierung

interface FormatDateOpts {
    dateOnly?: boolean;
    relative?: boolean;
    full?: boolean;
}

export function formatDate(iso: string, opts?: FormatDateOpts): string {
    const date = new Date(iso);

    if (opts?.dateOnly) {
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    if (opts?.relative) {
        return date.toLocaleDateString('de-DE', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
        });
    }

    if (opts?.full) {
        return date.toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    }

    const datePart = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
    });

    const timePart = date.toLocaleDateString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${datePart} ${timePart}`;
}

/** Gibt nur die Uhrzeit zurück: '15:30' */

export function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Formatiert Stunden + Minuten zu einer lesbaren Dauer.
 *
 * (1, 30) → '1:30h'
 * (0, 45) → '45 min'
 * (2,  0) → '2h'
 */

export function formatDuration(hours: number, minutes: number): string {
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}:${String(minutes).padStart(2, '0')}h`;
}

/** Formatiert Minuten zu '2:34h' / '45 min' / '-1:20h' (Vorzeichen für Saldo). */
export function formatMinutes(total: number): string {
    const sign = total < 0 ? '-' : '';
    const t = Math.abs(Math.round(total));
    const h = Math.floor(t / 60);
    const m = t % 60;
    if (h === 0) return `${sign}${m} min`;
    return `${sign}${h}:${String(m).padStart(2, '0')}h`;
}

/**
 * Gibt die ISO-Kalenderwoche für ein Datum zurück.
 * Woche beginnt am Montag (ISO 8601).
 */

export function getISOWeek(date: Date): number {
    const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
    );
}

/**
 * Gibt alle 7 Tage der aktuellen ISO-Woche zurück (Mo–So), normiert auf Mitternacht.
 */

export function getCurrentWeekDays(): Date[] {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

/** Vergleicht zwei Dates auf denselben Kalendertag. */
export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/** Tageskürzel Mo–So (Index 0–6). */
export const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

/** Gibt 'Guten Morgen' / 'Guten Tag' / 'Guten Abend' zurück. */
export function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Guten Morgen';
    if (h < 18) return 'Guten Tag';
    return 'Guten Abend';
}

/** Kompakte relative Zeit: 'jetzt', 'vor 5 min', 'vor 2 Std', 'vor 3 Tg'. */
export function formatRelativeShort(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return 'jetzt';
    if (minutes < 60) return `vor ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `vor ${days} Tg`;
    return new Date(iso).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    });
}

/** Formatiert Bytes in lesbare Größe: '2.4 MB', '340 KB'. */
export function formatFileSize(bytes: number): string {
    if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
    if (bytes >= 1_024) return `${Math.round(bytes / 1_024)} KB`;
    return `${bytes} B`;
}
