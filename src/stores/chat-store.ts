import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatMessage } from '../api/gemini';

interface ChatState {
    messages: ChatMessage[];
    setMessages: (messages: ChatMessage[]) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            messages: [],
            setMessages: (messages: ChatMessage[]) => set({ messages }),
            clearMessages: () => set({ messages: [] }),
        }),
        {
            name: 'chat-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
