import { createBrowserRouter, Navigate } from 'react-router';
import RootLayout from './layouts/RootLayout';
import ShellLayout from './layouts/AppLayout';
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
import ZeiterfassungPage from './pages/ZeiterfassungPage';
import AdminZeiterfassungPage from './pages/AdminZeiterfassungPage';
import VacationPage from './pages/VacationPage';
import AdminVacationPage from './pages/AdminVacationPage';

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                path: '/login',
                element: <LoginPage />,
            },
            {
                element: <ShellLayout role="fachkraft" />,
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
                    {
                        path: '/zeiterfassung',
                        element: <ZeiterfassungPage />,
                    },
                    { path: '/vacation', element: <VacationPage /> },
                    { path: '/notifications', element: <NotificationsPage /> },
                ],
            },
            {
                element: <ShellLayout role="admin" />,
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
                        path: '/admin/zeiterfassung',
                        element: <AdminZeiterfassungPage />,
                    },
                    { path: '/admin/urlaub', element: <AdminVacationPage /> },
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
