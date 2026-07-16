import { useState } from 'react';
import { Outlet } from 'react-router';
import Sidebar from '../components/shared/Sidebar';
import Topbar from '../components/shared/Topbar';
import ProtectedRoute from '../components/shared/ProtectedRoute';
import { NotificationProvider } from '../context/NotificationContext';

interface ShellLayoutProps {
    role: 'fachkraft' | 'admin';
}

export default function ShellLayout({ role }: ShellLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <ProtectedRoute role={role}>
            <NotificationProvider>
                <div className="flex min-h-screen bg-bg text-text font-sans">
                    <Sidebar
                        open={sidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                    />
                    <div className="flex-1 min-w-0 flex flex-col">
                        <Topbar
                            breadcrumbs={[]}
                            role={role}
                            onMenuClick={() => setSidebarOpen(true)}
                        />
                        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-12 lg:pb-16 max-w-7xl w-full mx-auto">
                            <Outlet />
                        </main>
                    </div>
                </div>
            </NotificationProvider>
        </ProtectedRoute>
    );
}
