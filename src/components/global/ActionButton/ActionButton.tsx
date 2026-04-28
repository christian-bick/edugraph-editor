import React, {useState} from 'react';
import './ActionButton.scss';
import clsx from 'clsx';
import {useAuthStore} from '../../../stores/auth-store';

interface ActionButtonProps {
    onClick: () => Promise<void> | void;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    title?: string;
    loadingText?: string;
    successText?: string;
    errorText?: string;
    requireConfirm?: boolean;
    confirmMessage?: string;
    requireGithubAuth?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    onClick,
    children,
    className,
    disabled,
    title,
    loadingText,
    successText,
    errorText,
    requireConfirm = false,
    confirmMessage = 'Are you sure?',
    requireGithubAuth = false,
}) => {
    const { token } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const isGithubAuthMissing = requireGithubAuth && !token;

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isGithubAuthMissing) {
            return;
        }

        if (requireConfirm && !window.confirm(confirmMessage)) {
            return;
        }

        setIsLoading(true);
        setStatus('loading');
        setErrorMessage(null);

        try {
            await onClick();
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err: any) {
            console.error('Action failed:', err);
            setStatus('error');
            setErrorMessage(err.message || 'Error');
            setTimeout(() => setStatus('idle'), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    if (isGithubAuthMissing) {
        return null;
    }

    return (
        <button
            className={clsx('action-button', className, status, { 'is-loading': isLoading })}
            onClick={handleClick}
            disabled={disabled || isLoading}
            title={errorMessage || title}
        >
            <span className="button-content">
                {status === 'loading' && (loadingText || children)}
                {status === 'success' && (successText || children)}
                {status === 'error' && (errorText || children)}
                {status === 'idle' && children}
            </span>
            {isLoading && <span className="spinner" />}
        </button>
    );
};
