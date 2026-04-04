import {create} from 'zustand'
import {loadOntologyFiles} from '../api/github.ts'
import type {Ontology, OntologyEntity, RelationType, OntologyRelations} from "../types/ontology-types.ts";
import {
    createEntityInfoMap,
    enrichOntology,
    getQuadsFromString,
    populateOntologyFromQuads
} from "./ontology-parser.ts";
import {temporal} from 'zundo';
import {produce} from 'immer';
import { RELATIONS } from "../config/relations.ts";

const IRI_NAMESPACE = 'http://edugraph.io/edu/';

// Store for the "live" or "draft" version of the ontology, with undo/redo
export interface CurrentOntologyState {
    ontologies: {
        Area: Ontology | null;
        Ability: Ontology | null;
        Scope: Ontology | null;
    };
    updateIri: (dimension: 'Area' | 'Ability' | 'Scope', originalEntity: OntologyEntity, newId: string) => string | undefined;
    updateDefinition: (dimension: 'Area' | 'Ability' | 'Scope', originalEntity: OntologyEntity, newDefinition: string) => void;
    updateRelations: (dimension: 'Area' | 'Ability' | 'Scope', subjectIri: string, relation: RelationType, objectIris: string[]) => void;
    createEntity: (dimension: 'Area' | 'Ability' | 'Scope', parentIri: string | null, newId: string, newDefinition: string) => void;
    deleteEntity: (dimension: 'Area' | 'Ability' | 'Scope', iriToDelete: string) => void;
    updateOntology: (dimension: 'Area' | 'Ability' | 'Scope', newOntology: Ontology) => void;
    setOntologies: (ontologies: CurrentOntologyState['ontologies']) => void;
}

export const useCurrentOntologyStore = create(
    temporal<CurrentOntologyState>(
        (set) => ({
            ontologies: { Area: null, Ability: null, Scope: null },
            setOntologies: (ontologies) => set({ ontologies }),
            updateOntology: (dimension, newOntology) => {
                set(produce(state => {
                    state.ontologies[dimension] = newOntology;
                }));
            },
            updateIri: (dimension, originalEntity, newId) => {
                let newIri: string | undefined;
                set(state => produce(state, (draft) => {
                    const ontology = draft.ontologies[dimension];
                    if (!ontology) return;

                    const oldIri = originalEntity.iri;
                    newIri = `${IRI_NAMESPACE}${newId}`;

                    if (oldIri === newIri) {
                        newIri = oldIri;
                        return; // IRI didn't change, no relation updates needed.
                    }

                    // 1. Update the entity itself
                    const entityToUpdate = ontology.entities.find(e => e.iri === oldIri);
                    if (entityToUpdate) {
                        entityToUpdate.iri = newIri;
                        entityToUpdate.name = newId;
                        // Sort entities after IRI change
                        ontology.entities.sort((a, b) => a.iri.localeCompare(b.iri));
                    }

                    // 2. Update relations where oldIri is involved (as subject or object)
                    Object.values(ontology.relations).forEach(relationMap => {
                        // a) Handle oldIri as a SUBJECT key
                        if (relationMap[oldIri]) {
                            relationMap[newIri] = [...relationMap[oldIri]];
                            delete relationMap[oldIri];
                        }

                        // b) Handle oldIri as an OBJECT in any subject's array
                        Object.keys(relationMap).forEach(subjectIri => {
                            const updatedObjectIris = relationMap[subjectIri].map(objIri =>
                                objIri === oldIri ? newIri : objIri
                            );
                            if (updatedObjectIris.some((val, idx) => val !== relationMap[subjectIri][idx])) {
                                relationMap[subjectIri] = updatedObjectIris.sort((a, b) => a.localeCompare(b));
                            }
                        });
                    });
                }));
                return newIri;
            },
            updateDefinition: (dimension, originalEntity, newDefinition) => {
                set(produce(state => {
                    const ontology = state.ontologies[dimension];
                    if (!ontology) return;

                    const entityToUpdate = ontology.entities.find(e => e.iri === originalEntity.iri);
                    if (entityToUpdate) {
                        entityToUpdate.definition = newDefinition;
                    }
                }));
            },
            updateRelations: (dimension, subjectIri, relation, objectIris) => {
                set(produce(state => {
                    const ontology = state.ontologies[dimension];
                    if (!ontology) return;

                    if (objectIris.length > 0) {
                        ontology.relations[relation][subjectIri] = [...objectIris].sort((a, b) => a.localeCompare(b));
                    } else {
                        delete ontology.relations[relation][subjectIri];
                    }
                }));
            },
            createEntity: (dimension, parentIri, newId, newDefinition) => {
                set(produce(state => {
                    const ontology = state.ontologies[dimension];
                    if (!ontology) return;

                    const newIri = `${IRI_NAMESPACE}${newId}`;

                    // 1. Create and add the new entity
                    const newEntity: OntologyEntity = {
                        iri: newIri,
                        name: newId,
                        definition: newDefinition,
                        examples: '', // Default examples
                    };
                    ontology.entities.push(newEntity);
                    ontology.entities.sort((a, b) => a.iri.localeCompare(b.iri));

                    // 2. If a parent is provided, create the 'partOf' relation
                    if (parentIri) {
                        ontology.relations.partOf[newIri] = [parentIri];
                    }
                }));
            },
            deleteEntity: (dimension, iriToDelete) => {
                set(produce(state => {
                    const ontology = state.ontologies[dimension];
                    if (!ontology) return;

                    // 1. Remove the entity itself
                    ontology.entities = ontology.entities.filter(e => e.iri !== iriToDelete);

                    // 2. Remove all relations involving the entity
                    Object.values(ontology.relations).forEach(relationMap => {
                        // a) Remove as subject
                        delete relationMap[iriToDelete];
                        
                        // b) Remove as object
                        for (const subjectIri in relationMap) {
                            const originalCount = relationMap[subjectIri].length;
                            relationMap[subjectIri] = relationMap[subjectIri].filter(objIri => objIri !== iriToDelete);
                            // If the array is now empty, delete the subject entry
                            if (relationMap[subjectIri].length === 0 && originalCount > 0) {
                                delete relationMap[subjectIri];
                            }
                        }
                    });
                }));
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
                const fileResponse = rawTurtles[i];
                const type = fileMapping[fileName];

                const quads = await getQuadsFromString(fileResponse.content);
                const entityInfoMap = createEntityInfoMap(quads);

                const relations: OntologyRelations = {} as any;
                RELATIONS.forEach(rel => {
                    relations[rel.id] = {};
                });

                const newOntology: Ontology = {
                    entities: [],
                    relations,
                    sha: fileResponse.sha
                };

                populateOntologyFromQuads(newOntology, quads, entityInfoMap, fileResponse.sha);
                finalOntologies[type] = newOntology;
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
