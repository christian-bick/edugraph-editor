import { create } from 'zustand';

type ViewMode = 'graph' | 'diff';

interface ViewState {
    view: ViewMode;
    toggleView: () => void;
    setView: (view: ViewMode) => void;
    showInferredRelations: boolean;
    toggleInferredRelations: () => void;
    setShowInferredRelations: (show: boolean) => void;
    boundaryEntityIri: string | null;
    setBoundaryEntityIri: (iri: string | null) => void;
}

export const useViewStore = create<ViewState>((set) => ({
    view: 'graph',
    toggleView: () => set((state) => ({ view: state.view === 'graph' ? 'diff' : 'graph' })),
    setView: (view: ViewMode) => set(() => ({ view: view })),
    showInferredRelations: true,
    toggleInferredRelations: () => set((state) => ({ showInferredRelations: !state.showInferredRelations })),
    setShowInferredRelations: (show: boolean) => set(() => ({ showInferredRelations: show })),
    boundaryEntityIri: null,
    setBoundaryEntityIri: (iri) => set({ boundaryEntityIri: iri }),
}));
