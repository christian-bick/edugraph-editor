import type { Ontology } from '../types/ontology-types';

export const invertRelations = (source: Record<string, string[]>) => {
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

export const toNaturalName = (name: string): string => {
    return name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Za-z])([0-9])/g, '$1 $2');
};

export const toCamelCase = (str: string): string => {
    return str
        .split(/[^a-zA-Z0-9]+/)
        .map((word) => {
            if (word.length === 0) return '';
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join('');
};


export const getSuccessors = (
    startIri: string,
    relations: Record<string, Record<string, string[]>>,
    relationsToFollow: string[]
): Set<string> => {
    const successors = new Set<string>();
    if (!startIri || !relations) return successors;

    const queue: string[] = [startIri];
    const visited = new Set<string>([startIri]);

    while (queue.length > 0) {
        const currentIri = queue.shift()!;

        for (const relName of relationsToFollow) {
            const relatedIris = relations[relName]?.[currentIri];

            if (relatedIris) {
                for (const nextIri of relatedIris) {
                    if (!visited.has(nextIri)) {
                        visited.add(nextIri);
                        successors.add(nextIri);
                        queue.push(nextIri);
                    }
                }
            }
        }
    }

    return successors;
};

export const getPredecessors = (
    startIri: string,
    relations: Record<string, Record<string, string[]>>,
    relationsToFollow: string[]
): Set<string> => {
    const predecessors = new Set<string>();
    if (!startIri || !relations) return predecessors;

    const invertedRelations: Record<string, Record<string, string[]>> = {};
    for (const relName of relationsToFollow) {
        if (relations[relName]) {
            invertedRelations[relName] = invertRelations(relations[relName]);
        }
    }

    const queue: string[] = [startIri];
    const visited = new Set<string>([startIri]);

    while (queue.length > 0) {
        const currentIri = queue.shift()!;

        for (const relName of relationsToFollow) {
            const relatedIris = invertedRelations[relName]?.[currentIri];

            if (relatedIris) {
                for (const nextIri of relatedIris) {
                    if (!visited.has(nextIri)) {
                        visited.add(nextIri);
                        predecessors.add(nextIri);
                        queue.push(nextIri);
                    }
                }
            }
        }
    }

    return predecessors;
};

/**
 * Calculates inferred relations based on inheritance through partOf relations.
 *
 * Rule:
 * IF (Parent_A) -[Rel]-> (Parent_B)
 * AND (Child_A) -[:partOf]-> (Parent_A)
 * AND (Child_B) -[:partOf]-> (Parent_B)
 * AND are_aligned(Child_A, Child_B)
 * THEN (Child_A) -[Rel]-> (Child_B)
 */
export const calculateInferredRelations = (ontology: Ontology): Partial<OntologyRelations> => {
    const inferred: Record<string, Record<string, string[]>> = {};
    const { entities, relations } = ontology;

    if (!relations) return inferred as any;

    const partOf = relations.partOf || {};
    const relTypes = Object.keys(relations) as RelationType[];
    // Semantic edges (exclude structural ones like partOf and ignored ones like includes)
    const semanticRelTypes = relTypes.filter(t => t !== 'partOf' && t !== 'includes');

    const areAligned = (childAIri: string, childBIri: string, parentAIri: string, parentBIri: string): boolean => {
        if (childAIri === childBIri) return false;

        const parentsA = partOf[childAIri] || [];
        const parentsB = partOf[childBIri] || [];

        // Case 1: Alignment via Shared Context (Intersection)
        // They share a partOf relationship to the exact same third node (Context_Node)
        const sharedContext = parentsA.find(p => parentsB.includes(p) && p !== parentAIri && p !== parentBIri);
        return !!sharedContext;
    };

    semanticRelTypes.forEach(relType => {
        const relMap = relations[relType];
        if (!relMap) return;

        inferred[relType] = {};

        for (const [parentAIri, parentBIris] of Object.entries(relMap)) {
            // Find children of A
            const childrenA = entities.filter(e => (partOf[e.iri] || []).includes(parentAIri));

            for (const parentBIri of parentBIris) {
                // Find children of B
                const childrenB = entities.filter(e => (partOf[e.iri] || []).includes(parentBIri));

                for (const childA of childrenA) {
                    for (const childB of childrenB) {
                        if (areAligned(childA.iri, childB.iri, parentAIri, parentBIri)) {
                            if (!inferred[relType][childA.iri]) {
                                inferred[relType][childA.iri] = [];
                            }
                            if (!inferred[relType][childA.iri].includes(childB.iri)) {
                                inferred[relType][childA.iri].push(childB.iri);
                            }
                        }
                    }
                }
            }
        }
    });

    return inferred as any;
};
