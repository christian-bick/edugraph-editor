import type {G6Edge, G6Node} from "../types/graph-types.ts";
import type {Ontology, OntologyRelations} from "../types/ontology-types.ts";
import {invertRelations, toNaturalName} from "../stores/utils.ts";

export const getGraphData = (
    ontology: Ontology | null,
    activeDimension: string,
    filterRelationType: keyof OntologyRelations | null = null,
    filterOrphanNodes = false,
    inverse = false
) => {
    const nodes: G6Node[] = [];
    const edges: G6Edge[] = [];
    if (!ontology || !filterRelationType) return { nodes, edges };

    const entityIRItoIdMap = new Map<string, string>();
    ontology.entities.forEach(entity => {
        const id = entity.iri;
        entityIRItoIdMap.set(entity.iri, id);
        nodes.push({
            id: id,
            label: toNaturalName(entity.name),
            entityType: activeDimension,
        });
    });

    let relations = ontology.relations[filterRelationType];
    if (inverse) {
        relations = invertRelations(relations);
    }
    
    if (relations) {
        Object.entries(relations).forEach(([subjectIRI, objectIRIs]) => {
            const sourceId = entityIRItoIdMap.get(subjectIRI);

            objectIRIs.forEach((objectIRI, index) => {
                const targetId = entityIRItoIdMap.get(objectIRI);

                if (sourceId && targetId) {
                    edges.push({
                        id: `${sourceId}-${filterRelationType}-${targetId}-${index}`,
                        source: sourceId,
                        target: targetId,
                        label: filterRelationType,
                    });
                }
            });
        });
    }

    if (filterOrphanNodes) {
        const participatingNodeIRIs = new Set<string>();
        edges.forEach(edge => {
            participatingNodeIRIs.add(edge.source);
            participatingNodeIRIs.add(edge.target);
        });

        const connectedNodes = nodes.filter(node => participatingNodeIRIs.has(node.id));
        return { nodes: connectedNodes, edges };
    }

    return { nodes, edges };
};
