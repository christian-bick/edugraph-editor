import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { loadBranches } from '../api/github.ts';

interface BranchState {
    branches: string[];
    activeBranch: string;
    activeDimension: string;
    activePerspective: string;
    loading: boolean;
    error: string | null;
    isHydrated: boolean;
}

interface BranchAction {
    setActiveBranch: (branch: string) => void;
    setActiveDimension: (dimension: string) => void;
    setActivePerspective: (perspective: string) => void;
    fetchBranches: () => Promise<string | undefined>;
    setHydrated: () => void;
}

export const useBranchStore = create<BranchState & BranchAction>()(
    persist(
        (set, get) => ({
            branches: ['main'], // Start with a default, will be overwritten by fetch
            activeBranch: 'main',
            activeDimension: 'Area',
            activePerspective: 'Taxonomy',
            loading: false,
            error: null,
            isHydrated: false,
            setHydrated: () => set({ isHydrated: true }),
            setActiveBranch: (branch) => set({ activeBranch: branch }),
            setActiveDimension: (dimension) => set({ activeDimension: dimension }),
            setActivePerspective: (perspective) => set({ activePerspective: perspective }),
            fetchBranches: async () => {
                if (get().loading) return;
                set({ loading: true, error: null });
                try {
                    const fetchedBranches = await loadBranches();
                    const currentActive = get().activeBranch;
                    const newActive = fetchedBranches.includes(currentActive) ? currentActive : fetchedBranches[0] || 'main';
                    set({
                        branches: fetchedBranches,
                        activeBranch: newActive,
                        loading: false
                    });
                    return newActive;
                } catch (error: any) {
                    set({ error: error.message, loading: false });
                    console.error("Failed to fetch branches:", error);
                }
            },
        }),
        {
            name: 'branch-storage', // unique name
            storage: createJSONStorage(() => sessionStorage), // use sessionStorage
            partialize: (state) => ({
                activeBranch: state.activeBranch,
                activeDimension: state.activeDimension,
                activePerspective: state.activePerspective,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);
