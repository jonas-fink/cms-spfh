import { createBrowserRouter, Navigate } from 'react-router';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';
import FKDashboardPage from './pages/FKDashboardPage';
import ClientDetailPage from './pages/ClientDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        element: <AppLayout />, // Sidebar + Topbar + <Outlet />
        children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            { path: '/dashboard', element: <FKDashboardPage /> },
            { path: '/clients', element: <div>Klienten (Placeholder)</div> },
            { path: '/clients/:id', element: <ClientDetailPage /> },
            { path: '/calendar', element: <div>Kalender (Placeholder)</div> },
            { path: '/documents', element: <div>Dokumente (Placeholder)</div> },
        ],
    },
    {
        element: <AdminLayout />,
        children: [
            { path: '/admin', element: <AdminDashboardPage /> },
            {
                path: '/admin/fachkraefte',
                element: <div>Fachkräfte (Placeholder)</div>,
            },
            {
                path: '/admin/clients',
                element: <div>Klienten (Placeholder)</div>,
            },
            {
                path: '/admin/stats',
                element: <div>Auslastung (Placeholder)</div>,
            },
            {
                path: '/admin/documents',
                element: <div>Dokumente (Placeholder)</div>,
            },
        ],
    },
]);
