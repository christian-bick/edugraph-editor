import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import type {ChatMessage} from '../api/gemini';

interface ChatState {
    messages: ChatMessage[];
    wasPlanExecuted: boolean;
    setMessages: (messages: ChatMessage[]) => void;
    setWasPlanExecuted: (val: boolean) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            messages: [],
            wasPlanExecuted: false,
            setMessages: (messages: ChatMessage[]) => set({ messages }),
            setWasPlanExecuted: (wasPlanExecuted: boolean) => set({ wasPlanExecuted }),
            clearMessages: () => set({ messages: [], wasPlanExecuted: false }),
        }),
        {
            name: 'chat-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
