import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type FocusMode = 'global' | 'ancestry' | 'local';

interface FocusState {
    focus: FocusMode;
    setFocus: (focus: FocusMode) => void;
}

export const useFocusStore = create<FocusState>()(
    persist(
        (set) => ({
            focus: 'global',
            setFocus: (focus: FocusMode) => set({ focus }),
        }),
        {
            name: 'focus-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
