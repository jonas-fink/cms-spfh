import { Navigate } from 'react-router';
import { useAuth } from '../../context/auth';

interface ProtectedRouteProps {
    role?: 'fachkraft' | 'admin';
    children: React.ReactNode;
}

export default function ProtectedRoute({
    role,
    children,
}: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bg">
                <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    if (role && user.role !== role) {
        return (
            <Navigate
                to={user.role === 'admin' ? '/admin' : '/dashboard'}
                replace
            />
        );
    }

    return <>{children}</>;
}
