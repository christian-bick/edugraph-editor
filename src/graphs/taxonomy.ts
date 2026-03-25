import type {G6Edge, G6Node} from "../types/graph-types.ts";
import type {Ontology, OntologyRelations, RelationType} from "../types/ontology-types.ts";
import {getPredecessors, getSuccessors, invertRelations, toNaturalName} from "../stores/utils.ts";
import {FocusMode} from "../stores/focus-store.ts";

export const getGraphData = (
    ontology: Ontology | null,
    activeDimension: string,
    filterRelationTypes: RelationType[] = [],
    filterOrphanNodes = false,
    inverse = false,
    focusMode: FocusMode = 'global',
    selectedEntityIri: string | null = null,
    useVirtualRoot = false,
) => {
    let nodes: G6Node[] = [];
    let edges: G6Edge[] = [];
    if (!ontology || filterRelationTypes.length === 0) return { nodes, edges };

    const entityIRItoIdMap = new Map<string, string>();
    ontology.entities.forEach(entity => {
        const id = entity.iri;
        entityIRItoIdMap.set(entity.iri, id);
        nodes.push({
            id: id,
            label: toNaturalName(entity.name),
            entityType: activeDimension as any,
        });
    });

    filterRelationTypes.forEach(relationType => {
        let relations = ontology.relations[relationType];
        if (inverse) {
            relations = invertRelations(relations);
        }

        if (relations) {
            Object.entries(relations)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([subjectIRI, objectIRIs]) => {
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

    if (focusMode !== 'global' && selectedEntityIri) {
        const irisToKeep = new Set<string>([selectedEntityIri]);
        const relationsToFollow = filterRelationTypes;

        if (focusMode === 'ancestry') {
            const successors = getSuccessors(selectedEntityIri, ontology.relations, relationsToFollow);
            const predecessors = getPredecessors(selectedEntityIri, ontology.relations, relationsToFollow);
            successors.forEach(iri => irisToKeep.add(iri));
            predecessors.forEach(iri => irisToKeep.add(iri));
        } else if (focusMode === 'local') {
            filterRelationTypes.forEach(relationType => {
                const directSuccessors = ontology.relations[relationType]?.[selectedEntityIri] || [];
                directSuccessors.forEach(iri => irisToKeep.add(iri));

                const inverted = invertRelations(ontology.relations[relationType] || {});
                const directPredecessors = inverted[selectedEntityIri] || [];
                directPredecessors.forEach(iri => irisToKeep.add(iri));
            });
        }

        nodes = nodes.filter(node => irisToKeep.has(node.id));
        edges = edges.filter(edge => irisToKeep.has(edge.source) && irisToKeep.has(edge.target));
    } else if (filterOrphanNodes) {
        const participatingNodeIRIs = new Set<string>();
        edges.forEach(edge => {
            participatingNodeIRIs.add(edge.source);
            participatingNodeIRIs.add(edge.target);
        });

        nodes = nodes.filter(node => participatingNodeIRIs.has(node.id));
    }

    if (useVirtualRoot) {
        const targetNodeIds = new Set(edges.map(e => e.target));
        const roots = nodes.filter(n => !targetNodeIds.has(n.id));

        if (roots.length > 1) {
            const virtualRootId = 'virtual-root';
            nodes.push({
                id: virtualRootId,
                label: activeDimension,
                entityType: activeDimension as any,
            });

            roots.forEach((root, index) => {
                edges.push({
                    id: `${virtualRootId}-${root.id}-${index}`,
                    source: virtualRootId,
                    target: root.id,
                    label: 'virtual-relation',
                });
            });
        }
    }

    return { nodes, edges };
};
