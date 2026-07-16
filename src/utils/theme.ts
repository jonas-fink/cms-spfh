// Light by default; 'dark' persisted in localStorage and mirrored on <html data-theme>.
export type Theme = 'light' | 'dark';

export function getTheme(): Theme {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function toggleTheme(): Theme {
    const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
    if (next === 'dark') {
        document.documentElement.dataset.theme = 'dark';
        localStorage.setItem('theme', 'dark');
    } else {
        delete document.documentElement.dataset.theme;
        localStorage.removeItem('theme');
    }
    return next;
}
