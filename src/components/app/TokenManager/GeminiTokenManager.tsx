import React, { useState } from 'react';
import { useAuthStore } from '../../../stores/auth-store';
import { verifyGeminiToken } from '../../../api/gemini';
import './TokenManager.scss';

export const GeminiTokenManager: React.FC = () => {
    const { geminiToken, setGeminiToken } = useAuthStore();
    const [inputValue, setInputValue] = useState(geminiToken || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        const isValid = await verifyGeminiToken(inputValue);
        setIsLoading(false);

        if (isValid) {
            setGeminiToken(inputValue);
            setSuccess('Token is valid and has been saved.');
        } else {
            setError('Invalid token. Please check the token and its permissions.');
        }
    };

    const handleClear = () => {
        setGeminiToken(null);
        setInputValue('');
        setError(null);
        setSuccess(null);
    };

    return (
        <div>
            <h3>Gemini API Token</h3>
            <p>
                Provide a Gemini API Token to use AI features.
                The token is stored in local storage.
            </p>
            <div className="form-section">
                <input
                    type="password"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setError(null);
                        setSuccess(null);
                    }}
                    placeholder="Enter your Gemini token"
                />
                <button onClick={handleSave} disabled={isLoading} className="primary">
                    {isLoading ? 'Verifying...' : 'Save'}
                </button>
                <button onClick={handleClear}>Clear</button>
            </div>

            <div className="token-manager-feedback">
                {isLoading && <p className="loading">Verifying token...</p>}
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
            </div>
        </div>
    );
};
