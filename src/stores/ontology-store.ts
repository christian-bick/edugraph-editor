import {create} from 'zustand'
import {loadOntologyFiles} from '../api/github.ts'
import type {Ontology, OntologyEntity} from "../types/ontology-types.ts";
import {
    createEntityInfoMap,
    enrichOntology,
    getQuadsFromString,
    populateOntologyFromQuads
} from "./ontology-parser.ts";
import { temporal } from 'zundo';
import { devtools } from 'zustand/middleware';
import { produce } from 'immer';

const IRI_NAMESPACE = 'http://edugraph.io/edu/';

interface OntologyState {
    ontologies: {
        Area: Ontology | null;
        Ability: Ontology | null;
        Scope: Ontology | null;
    };
    ontologiesOriginal: {
        Area: Ontology | null;
        Ability: Ontology | null;
        Scope: Ontology | null;
    };
    loading: boolean;
    error: string | null;
    fetchOntology: (branch: string) => Promise<void>;
    updateEntity: (dimension: 'Area' | 'Ability' | 'Scope', originalEntity: OntologyEntity, newId: string, newDefinition: string) => string | undefined;
}

export const useOntologyStore = create<OntologyState>()(
    devtools(
        temporal(
            (set, get) => ({
                ontologies: {
                    Area: null,
                    Ability: null,
                    Scope: null,
                },
                ontologiesOriginal: {
                    Area: null,
                    Ability: null,
                    Scope: null,
                },
                loading: false,
                error: null,
                fetchOntology: async (branch: string) => {
                    if (get().loading) return;

                    set({ loading: true, error: null }, false, 'FETCH');
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
                        set({
                            ontologies: structuredClone(finalOntologies),
                            ontologiesOriginal: finalOntologies,
                            loading: false
                        }, false, 'FETCH');
                        useOntologyStore.temporal.getState().clear()

                    } catch (error: any) {
                        set({ error: error.message, loading: false }, false, 'FETCH');
                        console.error(error);
                    }
                },
                updateEntity: (dimension, originalEntity, newId, newDefinition) => {
                    let newIri: string | undefined;
                    set(produce((draft: OntologyState) => {
                        const ontology = draft.ontologies[dimension];
                        if (!ontology) return;

                        const oldIri = originalEntity.iri;
                        newIri = `${IRI_NAMESPACE}${newId}`;

                        const entityToUpdate = ontology.entities.find(e => e.iri === oldIri);
                        if (entityToUpdate) {
                            entityToUpdate.iri = newIri;
                            entityToUpdate.name = newId;
                            entityToUpdate.definition = newDefinition;
                        }

                        Object.values(ontology.relations).forEach(relationMap => {
                            if (relationMap[oldIri]) {
                                relationMap[newIri] = relationMap[oldIri];
                                delete relationMap[oldIri];
                            }
                            Object.keys(relationMap).forEach(subjectIri => {
                                const index = relationMap[subjectIri].indexOf(oldIri);
                                if (index !== -1) {
                                    relationMap[subjectIri][index] = newIri;
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
    )
);
