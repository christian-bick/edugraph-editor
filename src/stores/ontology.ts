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
    expandedBy?: Record<string, string[]>;
    hasPart?: Record<string, string[]>;
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

const computeInverse = (source: Record<string, string[]>) => {
    const inverse: Record<string, string[]> = {};
    for (const [key, values] of Object.entries(source)) {
        for (const value of values) {
            if (!inverse[value]) {
                inverse[value] = [];
            }
            inverse[value].push(key);
        }
    }
    return inverse;
};

const enrichOntology = (ontology: Ontology): Ontology => {
    if (!ontology || !ontology.relations) return ontology;
    
    return {
        ...ontology,
        relations: {
            ...ontology.relations,
            expandedBy: computeInverse(ontology.relations.expands || {}),
            hasPart: computeInverse(ontology.relations.partOf || {}),
        }
    };
};

export const useOntologyStore = create<OntologyState & OntologyAction>()(
    persist(
        (set) => ({
            ontology: null,
            loading: false,
            error: null,
            setOntology: (ontology) => set({ontology: enrichOntology(ontology)}),
            fetchOntology: async () => {
                set({loading: true, error: null});
                try {
                    const rawOntology = await loadOntology();
                    set({ontology: enrichOntology(rawOntology), loading: false});
                } catch (error: any) {
                    set({error: error.message, loading: false});
                }
            },
        }),
        {
            name: 'ontology-storage',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => {
                if (state.ontology && state.ontology.relations) {
                    // Create a copy of ontology relations without derived properties
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { expandedBy, hasPart, ...persistedRelations } = state.ontology.relations;
                    return {
                        ...state,
                        ontology: {
                            ...state.ontology,
                            relations: persistedRelations
                        }
                    };
                }
                return state;
            },
            onRehydrateStorage: () => (state) => {
                if (state && state.ontology) {
                    state.setOntology(state.ontology);
                }
            },
        }
    )
)

