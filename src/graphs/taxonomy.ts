import type {G6Edge, G6Node} from "../types/graph-types.ts";
import type {Ontology, OntologyRelations} from "../types/ontology-types.ts";

export const getGraphData = (
    ontology: Ontology | null,
    activeDimension: string,
    filterRelationType: keyof OntologyRelations | null = null,
    filterOrphanNodes = false
) => {
    const nodes: G6Node[] = [];
    const edges: G6Edge[] = [];
    if (!ontology) return { nodes, edges };

    const entityIRItoIdMap = new Map<string, string>();
    const nodeIRIs = new Set<string>();

    // Process entities to create nodes
    ontology.entities.forEach(entity => {
        const id = entity.iri;
        entityIRItoIdMap.set(entity.iri, id);
        nodeIRIs.add(entity.iri);

        nodes.push({
            id: id,
            label: entity.natural_name || entity.name,
            entityType: activeDimension,
        });
    });

    // Process relations to create edges, applying relationType filter
    const relationTypes: Array<keyof OntologyRelations> = ['expands', 'partOf', 'includes', 'expandedBy', 'hasPart', 'includedBy'];
    relationTypes.forEach(relationType => {
        if (filterRelationType && relationType !== filterRelationType) {
            return; // Skip if filterRelationType is set and doesn't match
        }
        const relations = ontology.relations[relationType];
        if (relations) {
            Object.entries(relations).forEach(([subjectIRI, objectIRIs]) => {
                const sourceId = entityIRItoIdMap.get(subjectIRI);

                objectIRIs.forEach((objectIRI, index) => {
                    const targetId = entityIRItoIdMap.get(objectIRI);

                    if (sourceId && targetId) {
                        edges.push({
                            id: `${sourceId}-${relationType}-${targetId}-${index}`,
                            source: sourceId,
                            target: targetId,
                            label: relationType,
                        });
                    }
                });
            });
        }
    });

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
