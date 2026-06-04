import { createBrowserRouter, Navigate } from 'react-router';
import RootLayout from './layouts/RootLayout';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';
import FKDashboard from './pages/FKDashboard';
import ClientDetailPage from './pages/ClientDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminClientsPage from './pages/AdminClientsPage';
import AdminFachkraefteListPage from './pages/AdminFachkraefteListPage';

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                path: '/login',
                element: <LoginPage />,
            },
            {
                element: <AppLayout />,
                children: [
                    {
                        index: true,
                        element: <Navigate to="/dashboard" replace />,
                    },
                    { path: '/dashboard', element: <FKDashboard /> },
                    {
                        path: '/clients',
                        element: <div>Klienten (Placeholder)</div>,
                    },
                    { path: '/clients/:id', element: <ClientDetailPage /> },
                    {
                        path: '/calendar',
                        element: <div>Kalender (Placeholder)</div>,
                    },
                    {
                        path: '/documents',
                        element: <div>Dokumente (Placeholder)</div>,
                    },
                ],
            },
            {
                element: <AdminLayout />,
                children: [
                    { path: '/admin', element: <AdminDashboardPage /> },
                    {
                        path: '/admin/fachkraefte',
                        element: <AdminFachkraefteListPage />,
                    },
                    {
                        path: '/admin/clients',
                        element: <AdminClientsPage />,
                    },
                    {
                        path: '/admin/clients/:id',
                        element: <ClientDetailPage mode="admin" />,
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
        ],
    },
]);
