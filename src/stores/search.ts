import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

export const SearchFunction = {
    Classification: "Classification",
    Similarity: "Similarity",
} as const;

export type SearchFunction = (typeof SearchFunction)[keyof typeof SearchFunction];


export interface SearchInput {
    name: string
    preview: string
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
    input: SearchInput | null
    classification: Labels
    search: Labels
    loading: boolean
    highlightedResult: SearchResult | null
    selectedResult: SearchResult | null
    results: SearchResult[]
    selectedFunction: SearchFunction
}

interface SearchAction {
    setInput: (input: SearchInput) => void
    setClassification: (classification: Labels) => void
    setSearch: (search: Labels) => void
    setLoading: (loading: boolean) => void
    setHighlightedResult: (result: SearchResult | null) => void
    setSelectedResult: (result: SearchResult | null) => void
    setResults: (results: SearchResult[]) => void
    addResults: (results: SearchResult[]) => void
    setSelectedFunction: (selectedFunction: SearchFunction) => void
}

export const useSearchStore = create<SearchState & SearchAction>()(
    persist(
        (set) => ({
            input: null,
            results: [],
            classification: {Ability: [], Area: [], Scope: []},
            search: {Ability: [], Area: [], Scope: []},
            loading: false,
            highlightedResult: null,
            selectedResult: null,
            selectedFunction: SearchFunction.Classification,
            setInput: (input) => set(() => ({input: input})),
            setClassification: (classification) => set(() => ({classification: classification, search: classification})),
            setSearch: (search) => set(() => ({search: search})),
            setLoading: (loading) => set(() => ({loading: loading})),
            setHighlightedResult: (result) => set(() => ({highlightedResult: result})),
            setSelectedResult: (result) => set(() => ({selectedResult: result, highlightedResult: result})),
            setResults: (results) => set(() => ({results: results})),
            addResults: (results) => set((state) => ({results: [...state.results, ...results]})),
            setSelectedFunction: (selectedFunction) => set(() => ({
                selectedFunction: selectedFunction,
                selectedResult: null,
                highlightedResult: null
            })),
        }),
        {
            name: 'search-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
)



