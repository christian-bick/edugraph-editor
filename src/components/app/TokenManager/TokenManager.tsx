import React, { useState } from 'react';
import { useAuthStore } from '../../../stores/auth-store';

export const TokenManager: React.FC = () => {
    const { token, setToken } = useAuthStore();
    const [inputValue, setInputValue] = useState(token || '');

    const handleSave = () => {
        setToken(inputValue);
    };

    const handleClear = () => {
        setToken(null);
        setInputValue('');
    };

    return (
        <div>
            <h3>GitHub API Token</h3>
            <p>
                Provide a GitHub Personal Access Token to edit files and access private repositories.
                The token is stored in session storage and will be cleared when you close the tab.
            </p>
            <input
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter your GitHub token"
                style={{ width: '300px', marginRight: '10px' }}
            />
            <button onClick={handleSave}>Save</button>
            <button onClick={handleClear}>Clear</button>
        </div>
    );
};
