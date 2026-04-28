import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

interface AuthState {
    token: string | null;
    geminiToken: string | null;
    repoOwner: string;
    repoName: string;
    setToken: (token: string | null) => void;
    setGeminiToken: (token: string | null) => void;
    setRepoConfig: (owner: string, name: string) => void;
}

const TOKEN_STORAGE_KEY = 'auth-storage';

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            geminiToken: null,
            repoOwner: 'christian-bick',
            repoName: 'edugraph-ontology',
            setToken: (token: string | null) => set({ token }),
            setGeminiToken: (geminiToken: string | null) => set({ geminiToken }),
            setRepoConfig: (repoOwner: string, repoName: string) => set({ repoOwner, repoName }),
        }),
        {
            name: TOKEN_STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
        }
    )
);
