import { create } from 'zustand'

interface SearchFile {
    name: string,
    data: string
}

interface SearchState {
    file: SearchFile,
    setFile: (file: SearchFile) => void
}

export const useSearchStore = () => create<SearchState>(() => {})
