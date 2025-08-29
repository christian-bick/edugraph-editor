import {create} from 'zustand'

export interface SearchInput {
    name: string
    file: File
}

export interface Labels {
    Ability: string[],
    Area: string[],
    Scope: string[],
}

export interface SearchResult {
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
    highlightedResult: SearchResult
    results: [SearchResult]
}

interface SearchAction {
    setInput: (input: SearchInput) => void
    setClassification: (classification: Labels) => void
    setHighlightedResult:  (result: SearchResult) => void
    setResults: (results: [SearchResult]) => void
    addResults: (results: [SearchResult]) => void
}

export const useSearchStore = create<SearchState & SearchAction>((set) => ({
    input: null,
    results: [],
    setInput: (input) => set(() => ({input: input})),
    setClassification: (classification) => set(() => ({classification: classification})),
    setHighlightedResult:  (result: SearchResult) => set(() => ({highlightedResult: result})),
    setResults: (results) => set(() => ({results: results})),
    addResults: (results) => set((state) => ({results: [...state.results, ...results]}))
}))
