import {create} from 'zustand'
import {loadOntology} from '../api/github.ts'
import type {Ontology} from "../types/ontology-types.ts";
import {parseAndTransformOntology} from "./ontology-parser.ts";

interface OntologyState {
    ontology: Ontology | null;
    loading: boolean;
    error: string | null;
}

interface OntologyAction {
    setOntology: (ontology: Ontology) => void;
    fetchOntology: (branch: string) => Promise<void>;
}

export const useOntologyStore = create<OntologyState & OntologyAction>()((set) => ({
    ontology: null,
    loading: false,
    error: null,
    setOntology: (ontology) => set({ontology: ontology}),
    fetchOntology: async (branch: string) => {
        set({loading: true, error: null});
        try {
            const rawOntologyTurtle = await loadOntology(branch);
            const ontology = await parseAndTransformOntology(rawOntologyTurtle);
            set({ontology: ontology, loading: false});
        } catch (error: any) {
            set({error: error.message, loading: false});
            console.error(error);
        }
    },
}));
