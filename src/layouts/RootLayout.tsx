import { Outlet } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import ErrorBoundary from '../components/shared/ErrorBoundary';

export default function RootLayout() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <Outlet />
            </AuthProvider>
        </ErrorBoundary>
    );
}
