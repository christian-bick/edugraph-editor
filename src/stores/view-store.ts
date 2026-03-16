import { create } from 'zustand';

type ViewMode = 'graph' | 'diff';

interface ViewState {
    view: ViewMode;
    toggleView: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
    view: 'graph',
    toggleView: () => set((state) => ({ view: state.view === 'graph' ? 'diff' : 'graph' })),
}));
