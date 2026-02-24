import type {G6Edge, G6Node} from "../types/graph-types.ts";
import type {Ontology, OntologyEntities, OntologyRelations} from "../types/ontology-types.ts";

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
                        });
                    }
                });
            });
        }
    });

    return { nodes, edges };
};
