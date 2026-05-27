import { createContext, useContext } from 'react';

export interface AuthUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'fachkraft' | 'admin';
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    login: (input: LoginInput) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error(
            'useAuth muss innerhalb von <AuthProvider> verwendet werden',
        );
    return ctx;
}
