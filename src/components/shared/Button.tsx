import React from 'react';
import Icon, { type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent';
type Size = 'sm' | 'md';

interface ButtonProps {
    variant?: Variant;
    size?: Size;
    icon?: IconName;
    iconRight?: IconName;
    disabled?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    children?: React.ReactNode;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    title?: string;
}

const variantClasses: Record<Variant, string> = {
    primary: 'bg-text text-bg border border-text hover:opacity-85',
    secondary:
        'bg-surface text-text border border-border hover:bg-surface-hover',
    ghost: 'bg-transparent text-muted border border-transparent hover:bg-surface-hover hover:text-text',
    accent: 'bg-accent text-white border border-accent hover:opacity-85',
};

const sizeClasses: Record<Size, string> = {
    sm: 'h-[26px] px-[10px] text-[12px] gap-[5px]',
    md: 'h-[32px] px-[13px] text-[13px] gap-[6px]',
};

const iconSize: Record<Size, number> = { sm: 13, md: 14 };

export default function Button({
    variant = 'secondary',
    size = 'md',
    icon,
    iconRight,
    disabled = false,
    onClick,
    children,
    className = '',
    type = 'button',
    title,
}: ButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            title={title}
            className={`
        inline-flex items-center justify-center rounded-md font-medium
        whitespace-nowrap select-none shrink-0 cursor-pointer
        transition-all duration-100
        disabled:opacity-45 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
        >
            {icon && <Icon name={icon} size={iconSize[size]} />}
            {children && <span>{children}</span>}
            {iconRight && <Icon name={iconRight} size={iconSize[size]} />}
        </button>
    );
}
