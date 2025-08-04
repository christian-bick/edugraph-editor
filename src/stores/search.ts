import {create} from 'zustand'

interface SearchInput {
    name: string
    file: File
}

interface SearchResult {
    content: {
        preview: string
        original: string
    }
}

interface SearchState {
    input: SearchInput
    results: [SearchResult]
}

interface SearchAction {
    setInput: (input: SearchInput) => void
    addResults: (results: [SearchResult]) => void
}

export const useSearchStore = create<SearchState & SearchAction>((set) => ({
    input: null,
    results: [],
    setInput: (input) => set(() => ({input: input})),
    addResults: (results) => set((state) => ({results: [...state.results, ...results]}))
}))
