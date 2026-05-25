import { Outlet } from 'react-router';
import Sidebar from '../components/shared/Sidebar';
import Topbar from '../components/shared/Topbar';
import ProtectedRoute from '../components/shared/ProtectedRoute';

export default function AdminLayout() {
    return (
        <ProtectedRoute role="admin">
            <div className="flex min-h-screen bg-bg text-text font-sans">
                <Sidebar />
                <div className="flex-1 min-w-0 flex flex-col">
                    <Topbar breadcrumbs={[]} />
                    <main className="flex-1 px-8 pt-7 pb-16 max-w-7xl w-full mx-auto">
                        <Outlet />
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
