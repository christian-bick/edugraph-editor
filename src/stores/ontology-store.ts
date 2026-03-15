import {create} from 'zustand'
import {loadOntologyFiles} from '../api/github.ts'
import type {Ontology} from "../types/ontology-types.ts";
import {
    createEntityInfoMap,
    enrichOntology,
    getQuadsFromString,
    populateOntologyFromQuads
} from "./ontology-parser.ts";

interface OntologyState {
    ontologies: {
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

export const useOntologyStore = create<OntologyState & OntologyAction>()((set, get) => ({
    ontologies: {
        Area: null,
        Ability: null,
        Scope: null,
    },
    loading: false,
    error: null,
    fetchOntology: async (branch: string) => {
        if (get().loading) return; // Prevent concurrent fetches

        set({loading: true, error: null});
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

            set({ ontologies: finalOntologies, loading: false });

        } catch (error: any) {
            set({error: error.message, loading: false});
            console.error(error);
        }
    },
}));
