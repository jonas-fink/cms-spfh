import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleReset = () => this.setState({ error: null });

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="min-h-screen flex items-center justify-center bg-bg p-8">
                <div className="max-w-xl w-full bg-surface border border-border rounded-lg p-6">
                    <h1 className="text-[16px] font-semibold text-text mb-2">
                        Etwas ist schiefgelaufen.
                    </h1>
                    <pre className="text-[12px] text-muted whitespace-pre-wrap break-words mb-4">
                        {this.state.error.message}
                    </pre>
                    <button
                        onClick={this.handleReset}
                        className="text-[13px] px-3 py-1.5 rounded-md bg-accent text-white"
                    >
                        Neu laden
                    </button>
                </div>
            </div>
        );
    }
}
