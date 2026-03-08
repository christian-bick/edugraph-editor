import type {G6Edge, G6Node} from "../types/graph-types.ts";
import type {Ontology, OntologyEntities, OntologyRelations} from "../types/ontology-types.ts";

export const getGraphData = (
    ontology: Ontology | null,
    filterEntityType: keyof OntologyEntities | null = null,
    filterRelationType: keyof OntologyRelations | null = null,
    filterOrphanNodes = false
) => {
    const nodes: G6Node[] = [];
    const edges: G6Edge[] = [];
    if (!ontology) return { nodes, edges };

    const entityIRItoIdMap = new Map<string, string>(); // To ensure unique G6 node IDs from IRIs
    const filteredNodeIRIs = new Set<string>(); // To keep track of IRIs of nodes that pass the entityType filter

    // Process entities to create nodes, applying entityType filter
    (['Ability', 'Area', 'Scope'] as Array<keyof OntologyEntities>).forEach(entityType => {
        if (filterEntityType && entityType !== filterEntityType) {
            return; // Skip if filterEntityType is set and doesn't match
        }
        ontology.entities[entityType].forEach(entity => {
            const id = entity.iri;
            entityIRItoIdMap.set(entity.iri, id);
            filteredNodeIRIs.add(entity.iri); // Add to set of valid node IRIs

            nodes.push({
                id: id,
                label: entity.natural_name || entity.name, // Prefer natural_name, fall back to name
                entityType: entityType,
            });
        });
    });

    // Process relations to create edges, applying relationType filter
    const relationTypes: Array<keyof OntologyRelations> = ['expands', 'partOf', 'implies', 'expandedBy', 'hasPart', 'impliedBy'];
    relationTypes.forEach(relationType => {
        if (filterRelationType && relationType !== filterRelationType) {
            return; // Skip if filterRelationType is set and doesn't match
        }
        const relations = ontology.relations[relationType];
        if (relations) {
            Object.entries(relations).forEach(([subjectIRI, objectIRIs]) => {
                // Ensure subject node is in our filtered set
                if (!filteredNodeIRIs.has(subjectIRI)) {
                    return;
                }
                const sourceId = entityIRItoIdMap.get(subjectIRI);

                objectIRIs.forEach((objectIRI, index) => {
                    // Ensure object node is in our filtered set
                    if (!filteredNodeIRIs.has(objectIRI)) {
                        return;
                    }
                    const targetId = entityIRItoIdMap.get(objectIRI);

                    if (sourceId && targetId) { // Only add edge if both source and target nodes exist in the full map
                        edges.push({
                            id: `${sourceId}-${relationType}-${targetId}-${index}`, // Unique ID for edge
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
