import { create } from 'zustand';
import { loadBranches } from '../api/github.ts';

interface BranchState {
    branches: string[];
    activeBranch: string;
    loading: boolean;
    error: string | null;
}

interface BranchAction {
    setActiveBranch: (branch: string) => void;
    fetchBranches: () => Promise<void>;
}

export const useBranchStore = create<BranchState & BranchAction>((set) => ({
    branches: ['main'], // Start with a default, will be overwritten by fetch
    activeBranch: 'main',
    loading: false,
    error: null,
    setActiveBranch: (branch) => set({ activeBranch: branch }),
    fetchBranches: async () => {
        set({ loading: true, error: null });
        try {
            const fetchedBranches = await loadBranches();
            set({ branches: fetchedBranches, loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
            console.error("Failed to fetch branches:", error);
        }
    },
}));
