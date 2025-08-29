import {create} from 'zustand'

interface SearchInput {
    name: string
    file: File
}

interface Labels {
    Ability: string[],
    Area: string[],
    Scope: string[],
}

interface SearchResult {
    contentHash: string,
    questionDoc: string,
    questionImage: string,
    answerDoc: string,
    answerImage: string,
    created: number,
    source: string,
    versionHash: string
    labels: Labels
}

interface SearchState {
    input: SearchInput
    classification: Labels
    results: [SearchResult]
}

interface SearchAction {
    setInput: (input: SearchInput) => void
    setClassification: (classification: Labels) => void
    setResults: (results: [SearchResult]) => void
    addResults: (results: [SearchResult]) => void
}

export const useSearchStore = create<SearchState & SearchAction>((set) => ({
    input: null,
    results: [],
    setInput: (input) => set(() => ({input: input})),
    setClassification: (classification) => set(() => ({classification: classification})),
    setResults: (results) => set(() => ({results: results})),
    addResults: (results) => set((state) => ({results: [...state.results, ...results]}))
}))
