import React from 'react';

interface CardProps {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    className?: string;
    padding?: string;
}

export default function Card({
    children,
    onClick,
    className = '',
    padding = 'p-4',
}: CardProps) {
    return (
        <div
            onClick={onClick}
            className={`
        bg-surface border border-border rounded-lg overflow-hidden
        transition-colors duration-100
        ${onClick ? 'cursor-pointer hover:bg-surface-hover' : ''}
        ${padding}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
