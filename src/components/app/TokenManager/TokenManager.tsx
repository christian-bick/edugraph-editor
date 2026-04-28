import React, {useState} from 'react';
import {useAuthStore} from '../../../stores/auth-store';
import {verifyToken} from '../../../api/github';
import './TokenManager.scss';

export const TokenManager: React.FC = () => {
    const { token, setToken, repoOwner, repoName, setRepoConfig } = useAuthStore();
    const [tokenInput, setTokenInput] = useState(token || '');
    const [repoInput, setRepoInput] = useState(`${repoOwner}/${repoName}`);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSave = async () => {
        const parts = repoInput.split('/');
        if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
            setError('Please use the format "owner/repository"');
            return;
        }

        const owner = parts[0].trim();
        const repo = parts[1].trim();

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        // Verify access to the specific repository with the provided token
        const isValid = await verifyToken(tokenInput, owner, repo);
        setIsLoading(false);

        if (isValid) {
            setToken(tokenInput);
            setRepoConfig(owner, repo);
            setSuccess('Configuration saved and verified.');
        } else {
            setError('Verification failed. Please check your token and repository details.');
        }
    };

    const handleClear = () => {
        setToken(null);
        setTokenInput('');
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="token-manager">
            <h3>GitHub Configuration</h3>
            <p>
                Provide a GitHub Personal Access Token and repository details to edit and push changes.
            </p>

            <div className="form-group">
                <label>Repository</label>
                <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => {
                        setRepoInput(e.target.value);
                        setError(null);
                        setSuccess(null);
                    }}
                    placeholder="owner/repository"
                />
            </div>

            <div className="form-group">
                <label>GitHub Personal Access Token</label>
                <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => {
                        setTokenInput(e.target.value);
                        setError(null);
                        setSuccess(null);
                    }}
                    placeholder="ghp_xxxxxxxxxxxx"
                />
            </div>

            <div className="form-actions">
                <button onClick={handleSave} disabled={isLoading} className="primary">
                    {isLoading ? 'Verifying...' : 'Save & Verify'}
                </button>
                <button onClick={handleClear} className="secondary">Clear Token</button>
            </div>

            <div className="token-manager-feedback">
                {isLoading && <p className="loading">Verifying access...</p>}
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
            </div>
        </div>
    );
};
