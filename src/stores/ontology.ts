import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'
import {loadOntology} from '../api/ontology.ts'
import { Parser, Quad } from 'n3';

export interface OntologyEntity {
    iri: string;
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

// RDF URIs based on core-ontology.ttl
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const RDFS_COMMENT = 'http://www.w3.org/2000/01/rdf-schema#comment';
const RDFS_IS_DEFINED_BY = 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy';
const RDFS_SUB_PROPERTY_OF = 'http://www.w3.org/2000/01/rdf-schema#subPropertyOf';

const EDU_BASE = 'http://edugraph.io/edu#';
const OWL_NAMED_INDIVIDUAL = 'http://www.w3.org/2002/07/owl#NamedIndividual';

const TYPE_ABILITY = EDU_BASE + 'Ability';
const TYPE_AREA = EDU_BASE + 'Area';
const TYPE_SCOPE = EDU_BASE + 'Scope';

const PREDICATE_EXPANDS = EDU_BASE + 'expands';
const PREDICATE_PARTOF = EDU_BASE + 'partOf';
const PREDICATE_IMPLIES = EDU_BASE + 'implies';

interface EntityTempInfo {
    type: keyof OntologyEntities;
    name: string;
    natural_name: string;
    iri: string;
}

const parseAndTransformOntology = async (turtleString: string): Promise<Ontology> => {
    const parser = new Parser();

    const quads: Quad[] = await new Promise((resolve, reject) => {
        const parsedQuads: Quad[] = [];
        parser.parse(turtleString, (error, quad, prefixes) => {
            if (error) {
                return reject(error);
            }
            if (quad) {
                parsedQuads.push(quad);
            } else {
                resolve(parsedQuads);
            }
        });
    });

    const newOntology: Ontology = {
        entities: {
            Ability: [],
            Area: [],
            Scope: [],
        },
        relations: {
            expands: {},
            partOf: {},
            implies: {},
        },
    };

    const entityInfoMap = new Map<string, EntityTempInfo>(); // Key is IRI
    const subPropertyMap = new Map<string, string>(); // specificPropertyIRI -> generalPropertyIRI

    // Pre-pass: Identify sub-property relationships
    quads.forEach(quad => {
        if (quad.predicate.value === RDFS_SUB_PROPERTY_OF && quad.object.termType === 'NamedNode') {
            const specificProperty = quad.subject.value;
            const generalProperty = quad.object.value;
            if (generalProperty === PREDICATE_EXPANDS || generalProperty === PREDICATE_PARTOF || generalProperty === PREDICATE_IMPLIES) {
                subPropertyMap.set(specificProperty, generalProperty);
            }
        }
    });

    // First pass: Identify entities (NamedIndividuals) and their types
    quads.forEach(quad => {
        const subjectIRI = quad.subject.value;
        const predicateIRI = quad.predicate.value;
        const objectValue = quad.object.value;

        if (predicateIRI === RDF_TYPE && objectValue === OWL_NAMED_INDIVIDUAL) {
            // Initialize entity with default name, will refine type in second pass
            if (!entityInfoMap.has(subjectIRI)) {
                 entityInfoMap.set(subjectIRI, {
                    type: 'Ability', // Default, will be updated
                    name: subjectIRI.replace(EDU_BASE, ''),
                    natural_name: subjectIRI.replace(EDU_BASE, ''),
                    iri: subjectIRI
                });
            }
        }
    });

    // Second pass: Populate types, natural names, and relations
    quads.forEach(quad => {
        const subjectIRI = quad.subject.value;
        let predicateIRI = quad.predicate.value; // Allow modification for sub-properties
        const objectValue = quad.object.value;

        if (entityInfoMap.has(subjectIRI)) {
            const entity = entityInfoMap.get(subjectIRI)!;

            // Refine entity type
            if (predicateIRI === RDF_TYPE && (objectValue === TYPE_ABILITY || objectValue === TYPE_AREA || objectValue === TYPE_SCOPE)) {
                if (objectValue === TYPE_ABILITY) entity.type = 'Ability';
                else if (objectValue === TYPE_AREA) entity.type = 'Area';
                else if (objectValue === TYPE_SCOPE) entity.type = 'Scope';
            }
        }

        // Resolve predicate to its general form if it's a sub-property
        if (subPropertyMap.has(predicateIRI)) {
            predicateIRI = subPropertyMap.get(predicateIRI)!;
        }

        // Populate relations (subject and object must be NamedNodes)
        if (quad.subject.termType === 'NamedNode' && quad.object.termType === 'NamedNode') {
            const subjectName = quad.subject.value;
            const objectName = quad.object.value;

            if (predicateIRI === PREDICATE_EXPANDS) {
                if (!newOntology.relations.expands[subjectName]) {
                    newOntology.relations.expands[subjectName] = [];
                }
                newOntology.relations.expands[subjectName].push(objectName);
            } else if (predicateIRI === PREDICATE_PARTOF) {
                if (!newOntology.relations.partOf[subjectName]) {
                    newOntology.relations.partOf[subjectName] = [];
                }
                newOntology.relations.partOf[subjectName].push(objectName);
            } else if (predicateIRI === PREDICATE_IMPLIES) {
                if (!newOntology.relations.implies[subjectName]) {
                    newOntology.relations.implies[subjectName] = [];
                }
                newOntology.relations.implies[subjectName].push(objectName);
            }
        }
    });

    // Finally, add all collected entities to the newOntology.entities structure
    entityInfoMap.forEach(info => {
        // Ensure entity is of one of the expected types before adding
        if (['Ability', 'Area', 'Scope'].includes(info.type)) {
            newOntology.entities[info.type].push({
                iri: info.iri,
                name: info.name,
                natural_name: info.natural_name
            });
        }
    });

    return newOntology;
};

// Interface for G6 Node and Edge
interface G6Node {
    id: string;
    label: string;
    style?: any;
    type?: string;
    size?: number | number[];
    color?: string;
    entityType?: 'Ability' | 'Area' | 'Scope';
}

interface G6Edge {
    id?: string;
    source: string;
    target: string;
    label?: string;
    style?: any;
    type?: string;
    color?: string;
}

// Dummy G6 object for arrow path until G6 is properly imported in the consuming component
// This prevents TypeScript errors but is not functional.
const G6 = {
    Arrow: {
        triangle: (width: number, length: number) => `M 0 0 L ${length} ${width / 2} L ${length} ${-width / 2} Z`,
    },
};

// New function to convert Ontology to G6 Graph Data
export const getG6GraphData = (ontology: Ontology | null) => {
    const nodes: G6Node[] = [];
    const edges: G6Edge[] = [];
    if (!ontology) return { nodes, edges };

    const entityIRItoIdMap = new Map<string, string>(); // To ensure unique G6 node IDs from IRIs

    // Process entities to create nodes
    (['Ability', 'Area', 'Scope'] as Array<keyof OntologyEntities>).forEach(entityType => {
        ontology.entities[entityType].forEach(entity => {
            // Using entity.iri directly for ID for robustness in case name is not unique enough
            const id = entity.iri;
            entityIRItoIdMap.set(entity.iri, id);

            nodes.push({
                id: id,
                label: entity.natural_name || entity.name, // Prefer natural_name, fall back to name
                entityType: entityType,
                type: 'circle', // Default node shape
                size: 60,
                style: {
                    fill: entityType === 'Ability' ? '#9EC9FF' :
                          entityType === 'Area' ? '#A2CCFF' :
                          '#B5DFFF', // Different colors for different types
                    stroke: '#333',
                    lineWidth: 1,
                },
                labelCfg: {
                    style: {
                        fill: '#000',
                        fontSize: 10,
                    },
                },
            });
        });
    });

    // Process relations to create edges
    const relationTypes: Array<keyof OntologyRelations> = ['expands', 'partOf', 'implies'];
    relationTypes.forEach(relationType => {
        const relations = ontology.relations[relationType];
        if (relations) {
            Object.entries(relations).forEach(([subjectIRI, objectIRIs]) => {
                const sourceId = entityIRItoIdMap.get(subjectIRI);

                objectIRIs.forEach((objectIRI, index) => {
                    const targetId = entityIRItoIdMap.get(objectIRI);

                    if (sourceId && targetId) { // Only add edge if both source and target nodes exist
                        edges.push({
                            id: `${sourceId}-${relationType}-${targetId}-${index}`, // Unique ID for edge
                            source: sourceId,
                            target: targetId,
                            label: relationType,
                            type: 'line-arrow', // Default edge shape with arrow
                            style: {
                                stroke: relationType === 'expands' ? '#5B8EE4' :
                                        relationType === 'partOf' ? '#5AD8A6' :
                                        '#F7C96B', // Different colors for different relations
                                lineWidth: 1,
                                startArrow: false,
                                endArrow: {
                                    path: G6.Arrow.triangle(6, 8), // Standard arrow
                                    d: 0,
                                },
                            },
                            labelCfg: {
                                autoRotate: true,
                                style: {
                                    fill: '#555',
                                    fontSize: 8,
                                    background: {
                                        fill: '#fff',
                                        stroke: '#fff',
                                        padding: [2, 2, 2, 2],
                                        radius: 2,
                                    },
                                },
                            },
                        });
                    }
                });
            });
        }
    });

    return { nodes, edges };
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
                    const rawOntologyTurtle = await loadOntology();
                    const parsedOntology = await parseAndTransformOntology(rawOntologyTurtle);
                    set({ontology: enrichOntology(parsedOntology), loading: false});
                } catch (error: any) {
                    set({error: error.message, loading: false});
                    console.error(error);
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



