import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
    token: string | null;
    geminiToken: string | null;
    setToken: (token: string | null) => void;
    setGeminiToken: (token: string | null) => void;
}

const TOKEN_STORAGE_KEY = 'auth-storage';

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            geminiToken: null,
            setToken: (token: string | null) => set({ token }),
            setGeminiToken: (geminiToken: string | null) => set({ geminiToken }),
        }),
        {
            name: TOKEN_STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
        }
    )
);
