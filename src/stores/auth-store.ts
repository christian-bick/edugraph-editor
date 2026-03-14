import {create} from 'zustand';

interface AuthState {
    token: string | null;
    setToken: (token: string | null) => void;
}

const TOKEN_STORAGE_KEY = 'github_api_token';

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem(TOKEN_STORAGE_KEY) || null,
    setToken: (token: string | null) => {
        if (token) {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
        set({ token });
    },
}));
