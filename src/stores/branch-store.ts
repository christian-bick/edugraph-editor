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
    fetchBranches: () => Promise<void>;
}

export const useBranchStore = create<BranchState & BranchAction>()(
    persist(
        (set) => ({
            branches: ['main'], // Start with a default, will be overwritten by fetch
            activeBranch: 'main',
            activeDimension: 'Area',
            activePerspective: 'Taxonomy',
            loading: false,
            error: null,
            isHydrated: false,
            setActiveBranch: (branch) => set({ activeBranch: branch }),
            setActiveDimension: (dimension) => set({ activeDimension: dimension }),
            setActivePerspective: (perspective) => set({ activePerspective: perspective }),
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
        }),
        {
            name: 'branch-storage', // unique name
            storage: createJSONStorage(() => sessionStorage), // use sessionStorage
            partialize: (state) => ({
                activeBranch: state.activeBranch,
                activeDimension: state.activeDimension,
                activePerspective: state.activePerspective,
            }), // only persist activeBranch and activeDimension
            onRehydrateStorage: () => () => {
                useBranchStore.setState({ isHydrated: true });
            },
        }
    )
);
