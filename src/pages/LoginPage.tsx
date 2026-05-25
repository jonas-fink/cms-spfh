// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login({ email, password });
        } catch {
            setError('E-Mail oder Passwort ungültig.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo / App-Name */}
                <div className="text-center mb-8">
                    <h1 className="text-[22px] font-semibold text-text tracking-[-0.02em]">
                        SPFH
                    </h1>
                    <p className="text-[13px] text-muted mt-1">
                        Sozialpädagogische Familienhilfe
                    </p>
                </div>

                {/* Card */}
                <div className="bg-surface border border-border rounded-xl p-6">
                    <h2 className="text-[15px] font-semibold text-text tracking-[-0.01em] mb-5">
                        Anmelden
                    </h2>

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-3.5"
                    >
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11.5px] font-medium text-muted">
                                E-Mail
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.de"
                                required
                                autoFocus
                                className="px-3 py-2 text-[13px] text-text bg-bg border border-border rounded-lg outline-none placeholder:text-muted focus:border-accent transition-colors duration-100"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11.5px] font-medium text-muted">
                                Passwort
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="px-3 py-2 text-[13px] text-text bg-bg border border-border rounded-lg outline-none placeholder:text-muted focus:border-accent transition-colors duration-100"
                            />
                        </div>

                        {error && (
                            <p className="text-[12.5px] text-[#dc2626] bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 py-2 text-[13px] font-medium bg-text text-bg rounded-lg cursor-pointer border-none hover:opacity-90 transition-opacity duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Anmelden…' : 'Anmelden'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
