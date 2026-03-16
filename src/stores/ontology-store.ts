import {create} from 'zustand'
import {loadOntologyFiles} from '../api/github.ts'
import type {Ontology} from "../types/ontology-types.ts";
import {
    createEntityInfoMap,
    enrichOntology,
    getQuadsFromString,
    populateOntologyFromQuads
} from "./ontology-parser.ts";
import { temporal } from 'zundo';
import { devtools } from 'zustand/middleware';

interface OntologyTemporalState {
    ontologies: {
        Area: Ontology | null;
        Ability: Ontology | null;
        Scope: Ontology | null;
    };
}

interface OntologyState extends OntologyTemporalState {
    ontologiesOriginal: {
        Area: Ontology | null;
        Ability: Ontology | null;
        Scope: Ontology | null;
    };
    loading: boolean;
    error: string | null;
}

interface OntologyAction {
    fetchOntology: (branch: string) => Promise<void>;
}

type OntologyStore = OntologyState & OntologyAction;

export const useTemporalOntologyStore = create(
    temporal<OntologyTemporalState>(
        (set) => ({
            ontologies: {
                Area: null,
                Ability: null,
                Scope: null,
            },
            setOntologies: (ontologies: OntologyTemporalState['ontologies']) => set({ ontologies }),
        }),
        {
            partialize: (state) => ({ ontologies: state.ontologies }),
        }
    )
);

export const useOntologyStore = create<OntologyStore>()(
    devtools((set, get) => ({
        ...useTemporalOntologyStore.getState(),
        ontologiesOriginal: {
            Area: null,
            Ability: null,
            Scope: null,
        },
        loading: false,
        error: null,
        fetchOntology: async (branch: string) => {
            if (get().loading) return;

            set({ loading: true, error: null });
            try {
                const fileMapping: Record<string, 'Area' | 'Ability' | 'Scope'> = {
                    "core-areas-math.ttl": "Area",
                    "core-abilities.ttl": "Ability",
                    "core-scopes-math.ttl": "Scope",
                };
                const files = Object.keys(fileMapping);
                const rawTurtles = await loadOntologyFiles(files, branch);

                const finalOntologies: { Area: Ontology | null, Ability: Ontology | null, Scope: Ontology | null } = {
                    Area: null,
                    Ability: null,
                    Scope: null,
                };

                for (let i = 0; i < files.length; i++) {
                    const fileName = files[i];
                    const rawTurtle = rawTurtles[i];
                    const type = fileMapping[fileName];

                    const quads = await getQuadsFromString(rawTurtle);
                    const entityInfoMap = createEntityInfoMap(quads);

                    const newOntology: Ontology = {
                        entities: [],
                        relations: {
                            expands: {},
                            partOf: {},
                            includes: {},
                        },
                    };

                    populateOntologyFromQuads(newOntology, quads, entityInfoMap);
                    const finalOntology = enrichOntology(newOntology);
                    finalOntologies[type] = finalOntology;
                }

                useTemporalOntologyStore.getState().setOntologies(structuredClone(finalOntologies));

                set({
                    ontologiesOriginal: finalOntologies,
                    loading: false
                });

            } catch (error: any) {
                set({ error: error.message, loading: false });
                console.error(error);
            }
        },
    }))
);

// Subscribe to the temporal store and update the main store
useTemporalOntologyStore.subscribe(
    (state) => {
        useOntologyStore.setState({ ontologies: state.ontologies });
    }
);
