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
