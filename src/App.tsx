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
import AdminStatsPage from './pages/AdminStatsPage';
import AdminDocumentsPage from './pages/AdminDocumentsPage';
import ClientsListPage from './pages/ClientsListPage';
import CalendarPage from './pages/CalendarPage';
import DocumentsPage from './pages/DocumentsPage';
import NotificationsPage from './pages/NotificationsPage';

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
                    { path: '/clients', element: <ClientsListPage /> },
                    { path: '/clients/:id', element: <ClientDetailPage /> },
                    { path: '/calendar', element: <CalendarPage /> },
                    { path: '/documents', element: <DocumentsPage /> },
                    { path: '/notifications', element: <NotificationsPage /> },
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
                    { path: '/admin/stats', element: <AdminStatsPage /> },
                    {
                        path: '/admin/documents',
                        element: <AdminDocumentsPage />,
                    },
                    {
                        path: '/admin/notifications',
                        element: <NotificationsPage />,
                    },
                    {
                        path: '/admin/calendar',
                        element: <CalendarPage />,
                    },
                ],
            },
        ],
    },
]);
