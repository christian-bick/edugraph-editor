import type {G6Edge, G6Node} from "../types/graph-types.ts";
import type {Ontology, OntologyRelations} from "../types/ontology-types.ts";
import {getPredecessors, getSuccessors, invertRelations, toNaturalName} from "../stores/utils.ts";
import {FocusMode} from "../stores/focus-store.ts";

export const getGraphData = (
    ontology: Ontology | null,
    activeDimension: string,
    filterRelationType: keyof OntologyRelations | null = null,
    filterOrphanNodes = false,
    inverse = false,
    focusMode: FocusMode = 'global',
    selectedEntityIri: string | null = null,
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

    if (focusMode !== 'global' && selectedEntityIri) {
        const irisToKeep = new Set<string>([selectedEntityIri]);
        const relationsToFollow = filterRelationType ? [filterRelationType] : [];

        if (focusMode === 'ancestry') {
            const successors = getSuccessors(selectedEntityIri, ontology.relations, relationsToFollow);
            const predecessors = getPredecessors(selectedEntityIri, ontology.relations, relationsToFollow);
            successors.forEach(iri => irisToKeep.add(iri));
            predecessors.forEach(iri => irisToKeep.add(iri));
        } else if (focusMode === 'local') {
            const directSuccessors = ontology.relations[filterRelationType]?.[selectedEntityIri] || [];
            directSuccessors.forEach(iri => irisToKeep.add(iri));

            const inverted = invertRelations(ontology.relations[filterRelationType] || {});
            const directPredecessors = inverted[selectedEntityIri] || [];
            directPredecessors.forEach(iri => irisToKeep.add(iri));
        }

        const filteredNodes = nodes.filter(node => irisToKeep.has(node.id));
        const filteredEdges = edges.filter(edge => irisToKeep.has(edge.source) && irisToKeep.has(edge.target));

        return { nodes: filteredNodes, edges: filteredEdges };
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
