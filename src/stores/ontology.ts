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
    implies: Record<string, string[]>;
    expandedBy?: Record<string, string[]>;
    hasPart?: Record<string, string[]>;
    impliedBy?: Record<string, string[]>;
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

const computeTransitiveClosure = (source: Record<string, string[]>) => {
    const closure: Record<string, Set<string>> = {};

    // Initialize with direct relations
    Object.keys(source).forEach(key => {
        closure[key] = new Set(source[key]);
    });

    let changed = true;
    while (changed) {
        changed = false;
        // Create a snapshot of keys to iterate to allow reading updated sets effectively
        // (though finding fixed point doesn't strictly need snapshot if we just iterate enough)
        const keys = Object.keys(closure);
        for (const key of keys) {
            const currentSet = closure[key];
            const originalSize = currentSet.size;

            for (const neighbor of Array.from(currentSet)) {
                if (closure[neighbor]) {
                    for (const n of Array.from(closure[neighbor])) {
                        currentSet.add(n);
                    }
                }
            }

            if (currentSet.size > originalSize) {
                changed = true;
            }
        }
    }

    // Convert back to arrays
    const result: Record<string, string[]> = {};
    Object.keys(closure).forEach(key => {
        result[key] = Array.from(closure[key]);
    });
    return result;
};

const enrichOntology = (ontology: Ontology): Ontology => {
    if (!ontology || !ontology.relations) return ontology;

    const transitiveImplies = computeTransitiveClosure(ontology.relations.implies || {});

    return {
        ...ontology,
        relations: {
            ...ontology.relations,
            implies: transitiveImplies,
            expandedBy: computeInverse(ontology.relations.expands || {}),
            hasPart: computeInverse(ontology.relations.partOf || {}),
            impliedBy: computeInverse(transitiveImplies),
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
                    const { expandedBy, hasPart, impliedBy, ...persistedRelations } = state.ontology.relations;
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


