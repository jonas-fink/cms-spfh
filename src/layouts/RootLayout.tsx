import { Outlet } from 'react-router';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <Outlet />
        </AuthProvider>
    );
}
