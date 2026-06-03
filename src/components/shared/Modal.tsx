import { useEffect } from 'react';
import Icon from './Icon';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: number;
}

export default function Modal({
    open,
    onClose,
    title,
    children,
    width = 520,
}: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-surface border border-border rounded-[10px] shadow-2xl w-full mx-4"
                style={{ maxWidth: width }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    <h2 className="text-[14px] font-semibold text-text m-0">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Schließen"
                        className="bg-transparent border-none cursor-pointer text-muted p-1 rounded-md hover:bg-surface-hover transition-colors duration-100"
                    >
                        <Icon name="x" size={16} stroke={1.75} />
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );
}
