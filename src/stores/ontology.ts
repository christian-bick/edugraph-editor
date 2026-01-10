import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'
import {loadOntology} from '../api/ontology.ts'

export interface OntologyEntity {
    name: string;
    natural_name: string;
}

export interface OntologyEntities {
    Ability: OntologyEntity[];
    Area: OntologyEntity[];
    Scope: OntologyEntity[];
}

export interface OntologyRelations {
    expands: Record<string, string[]>;
    partOf: Record<string, string[]>;
}

export interface Ontology {
    entities: OntologyEntities;
    relations: OntologyRelations;
}

interface OntologyState {
    ontology: Ontology | null;
    loading: boolean;
    error: string | null;
}

interface OntologyAction {
    setOntology: (ontology: Ontology) => void;
    fetchOntology: () => Promise<void>;
}

export const useOntologyStore = create<OntologyState & OntologyAction>()(
    persist(
        (set) => ({
            ontology: null,
            loading: false,
            error: null,
            setOntology: (ontology) => set({ontology}),
            fetchOntology: async () => {
                set({loading: true, error: null});
                try {
                    const ontology = await loadOntology();
                    set({ontology, loading: false});
                } catch (error: any) {
                    set({error: error.message, loading: false});
                }
            },
        }),
        {
            name: 'ontology-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
)
