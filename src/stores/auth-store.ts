import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    setToken: (token: string | null) => void;
}

const TOKEN_STORAGE_KEY = 'github_api_token';

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            setToken: (token: string | null) => set({ token }),
        }),
        {
            name: TOKEN_STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
        }
    )
);
