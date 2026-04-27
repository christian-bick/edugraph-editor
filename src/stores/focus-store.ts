import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

export type FocusMode = 'global' | 'ancestry' | 'local';

interface FocusState {
    activeFocus: FocusMode;
    setFocus: (focus: FocusMode) => void;
}

export const useFocusStore = create<FocusState>()(
    persist(
        (set) => ({
            activeFocus: 'global',
            setFocus: (focus: FocusMode) => set({ activeFocus: focus }),
        }),
        {
            name: 'focus-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
