import { useAuth } from '../../context/auth';
import { Link, useLocation } from 'react-router';
import Icon, { type IconName } from './Icon';
import Avatar from './Avatar';

interface NavItem {
    path: string;
    label: string;
    icon: IconName;
    badge?: number;
}

const fkNav: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/clients', label: 'Meine Klienten', icon: 'users' },
    { path: '/calendar', label: 'Termine', icon: 'calendar' },
    { path: '/documents', label: 'Dokumente', icon: 'file' },
];

const adminNav: NavItem[] = [
    { path: '/admin', label: 'Übersicht', icon: 'home' },
    { path: '/admin/fachkraefte', label: 'Fachkräfte', icon: 'users' },
    { path: '/admin/clients', label: 'Klienten', icon: 'user' },
    { path: '/admin/calendar', label: 'Einsatzplaner', icon: 'calendar' },
    { path: '/admin/stats', label: 'Auslastung', icon: 'chart' },
    { path: '/admin/documents', label: 'Dokumente', icon: 'file' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { pathname } = useLocation();
    const nav = user?.role === 'admin' ? adminNav : fkNav;

    return (
        <aside className="w-60 min-w-60 h-screen sticky top-0 flex flex-col bg-surface border-r border-border overflow-y-auto">
            {/* Logo */}
            <div className="h-14 flex items-center px-5 border-b border-border shrink-0">
                <div className="w-7 h-7 rounded-[7px] bg-accent flex items-center justify-center mr-2.5">
                    <Icon name="sparkle" size={14} color="#fff" />
                </div>
                <span className="text-[14px] font-semibold text-text tracking-[-0.01em]">
                    SPFH
                </span>
            </div>

            {/* Nav */}
            <nav className="p-2 flex-1">
                {nav.map((item) => {
                    const active =
                        pathname.startsWith(item.path) &&
                        (item.path !== '/' || pathname === '/');
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                flex items-center gap-2.25 px-2.5 py-1.75 rounded-md text-[13px]
                transition-colors duration-100 mb-px no-underline
                ${
                    active
                        ? 'bg-surface-hover text-text font-medium'
                        : 'text-muted hover:bg-surface-hover hover:text-text font-normal'
                }
              `}
                        >
                            <Icon
                                name={item.icon}
                                size={15}
                                stroke={active ? 2 : 1.75}
                            />
                            <span className="flex-1">{item.label}</span>
                            {!!item.badge && (
                                <span className="bg-accent text-white text-[10px] font-semibold rounded-full px-1.5 py-px min-w-4.5 text-center">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Card */}
            <div className="flex items-center gap-2.5 p-3.5 border-t border-border shrink-0">
                <Avatar
                    name={`${user?.firstName} ${user?.lastName}`}
                    size={30}
                />
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-text truncate m-0">
                        {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11.5px] text-muted m-0">
                        {user?.role === 'admin' ? 'Admin' : 'Fachkraft'}
                    </p>
                </div>
                <button
                    onClick={logout}
                    className="text-muted hover:text-text p-1 rounded-md transition-colors"
                    title="Abmelden"
                >
                    <Icon name="settings" size={15} />
                </button>
            </div>
        </aside>
    );
}
