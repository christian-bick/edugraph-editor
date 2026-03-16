import {create} from 'zustand'
import {loadOntologyFiles} from '../api/github.ts'
import type {Ontology, OntologyEntity} from "../types/ontology-types.ts";
import {
    createEntityInfoMap,
    enrichOntology,
    getQuadsFromString,
    populateOntologyFromQuads
} from "./ontology-parser.ts";
import {temporal} from 'zundo';
import {produce} from 'immer';

const IRI_NAMESPACE = 'http://edugraph.io/edu/';

// Store for the "live" or "draft" version of the ontology, with undo/redo
export interface CurrentOntologyState {
    ontologies: {
        Area: Ontology | null;
        Ability: Ontology | null;
        Scope: Ontology | null;
    };
    updateEntity: (dimension: 'Area' | 'Ability' | 'Scope', originalEntity: OntologyEntity, newId: string, newDefinition: string) => string | undefined;
    setOntologies: (ontologies: CurrentOntologyState['ontologies']) => void;
}

export const useCurrentOntologyStore = create(
    temporal<CurrentOntologyState>(
        (set) => ({
            ontologies: { Area: null, Ability: null, Scope: null },
            setOntologies: (ontologies) => set({ ontologies }),
            updateEntity: (dimension, originalEntity, newId, newDefinition) => {
                let newIri: string | undefined;
                set(state => produce(state, (draft) => {
                    const ontology = draft.ontologies[dimension];
                    if (!ontology) return;

                    const oldIri = originalEntity.iri;
                    newIri = `${IRI_NAMESPACE}${newId}`;

                    // 1. Update the entity itself
                    const entityToUpdate = ontology.entities.find(e => e.iri === oldIri);
                    if (entityToUpdate) {
                        entityToUpdate.iri = newIri;
                        entityToUpdate.name = newId;
                        entityToUpdate.definition = newDefinition;
                    }

                    // 2. Update relations where oldIri is involved (as subject or object)
                    Object.values(ontology.relations).forEach(relationMap => {
                        // a) Handle oldIri as a SUBJECT key
                        if (relationMap[oldIri]) {
                            if (oldIri !== newIri) { // Only rename if IRI actually changes
                                relationMap[newIri] = [...relationMap[oldIri]];
                                delete relationMap[oldIri];
                            } else { // If IRI is the same, just ensure Immer tracks array changes
                                relationMap[oldIri] = [...relationMap[oldIri]];
                            }
                        }

                        // b) Handle oldIri as an OBJECT in any subject's array
                        // Iterate through current subject keys (which might now include newIri)
                        Object.keys(relationMap).forEach(subjectIri => {
                            // Map over the object IRIs to replace all occurrences of oldIri with newIri
                            const updatedObjectIris = relationMap[subjectIri].map(objIri =>
                                objIri === oldIri ? newIri : objIri
                            );
                            // Only update if changes were made to avoid unnecessary immer tracking
                            // And ensure we don't accidentally replace the original array if nothing changed
                            if (updatedObjectIris.some((val, idx) => val !== relationMap[subjectIri][idx])) {
                                relationMap[subjectIri] = updatedObjectIris;
                            }
                        });
                    });
                }));
                return newIri;
            },
        }),
        {
            partialize: (state) => ({ ontologies: state.ontologies }),
        }
    )
);

// Store for the stable, original ontology data and fetching logic
interface OntologyState {
    ontologiesOriginal: {
        Area: Ontology | null;
        Ability: Ontology | null;
        Scope: Ontology | null;
    };
    loading: boolean;
    error: string | null;
    fetchOntology: (branch: string) => Promise<void>;
}

export const useOntologyStore = create<OntologyState>()((set, get) => ({
    ontologiesOriginal: { Area: null, Ability: null, Scope: null },
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

            const finalOntologies: { Area: Ontology | null; Ability: Ontology | null; Scope: Ontology | null } = {
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
                    relations: { expands: {}, partOf: {}, includes: {} },
                };

                populateOntologyFromQuads(newOntology, quads, entityInfoMap);
                finalOntologies[type] = enrichOntology(newOntology);
            }

            set({ ontologiesOriginal: finalOntologies, loading: false });
            useCurrentOntologyStore.getState().setOntologies(structuredClone(finalOntologies));
            useCurrentOntologyStore.temporal.getState().clear();

        } catch (error: any) {
            set({ error: error.message, loading: false });
            console.error(error);
        }
    },
}));
