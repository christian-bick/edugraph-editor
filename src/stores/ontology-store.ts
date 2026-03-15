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
    ontology: Ontology | null;
    loading: boolean;
    error: string | null;
}

interface OntologyAction {
    setOntology: (ontology: Ontology) => void;
    fetchOntology: (branch: string) => Promise<void>;
}

export const useOntologyStore = create<OntologyState & OntologyAction>()((set, get) => ({
    ontology: null,
    loading: false,
    error: null,
    setOntology: (ontology) => set({ontology: ontology}),
    fetchOntology: async (branch: string) => {
        if (get().loading) return; // Prevent concurrent fetches

        set({loading: true, error: null});
        try {
            const files = ["core-abilities.ttl", "core-areas-math.ttl", "core-scopes-math.ttl"];
            const rawOntologyTurtles = await loadOntologyFiles(files, branch);

            const quadPromises = rawOntologyTurtles.map(getQuadsFromString);
            const quadsPerFile = await Promise.all(quadPromises);
            const allQuads = quadsPerFile.flat();

            const entityInfoMap = createEntityInfoMap(allQuads);

            const newOntology: Ontology = {
                entities: {
                    Ability: [],
                    Area: [],
                    Scope: [],
                },
                relations: {
                    expands: {},
                    partOf: {},
                    includes: {},
                },
            };

            populateOntologyFromQuads(newOntology, allQuads, entityInfoMap);

            const finalOntology = enrichOntology(newOntology);

            set({ontology: finalOntology, loading: false});
        } catch (error: any) {
            set({error: error.message, loading: false});
            console.error(error);
        }
    },
}));
