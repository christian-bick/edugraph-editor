import React from 'react';
import { useAuthStore } from '../../../../stores/auth-store';
import GeminiIcon from '../../../../assets/icons/gemini.svg';

interface SuggestButtonProps {
    onClick: () => void;
    isSuggesting: boolean;
    disabled: boolean;
}

export const SuggestButton: React.FC<SuggestButtonProps> = ({ onClick, isSuggesting, disabled }) => {
    const { geminiToken } = useAuthStore();
    
    if (!geminiToken) return null;

    return (
        <button
            className="suggest-button"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            disabled={disabled || isSuggesting}
            type="button"
            title={disabled ? "Enter an ID/Name first" : "Get definition suggestion from Gemini"}
        >
            <img src={GeminiIcon} alt="Gemini" />
            {isSuggesting ? 'Suggesting...' : 'Suggest'}
        </button>
    );
};
