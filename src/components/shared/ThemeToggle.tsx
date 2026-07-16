import { useState } from 'react';
import Icon from './Icon';
import { getTheme, toggleTheme } from '../../utils/theme';

export default function ThemeToggle() {
    const [theme, setTheme] = useState(getTheme);
    const dark = theme === 'dark';
    return (
        <button
            onClick={() => setTheme(toggleTheme())}
            className="text-muted hover:text-text p-1.5 rounded-md transition-colors cursor-pointer"
            aria-label={dark ? 'Helles Design' : 'Dunkles Design'}
            title={dark ? 'Helles Design' : 'Dunkles Design'}
        >
            <Icon name={dark ? 'sun' : 'moon'} size={17} />
        </button>
    );
}
