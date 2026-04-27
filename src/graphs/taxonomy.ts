import type {G6Edge, G6Node} from "../types/graph-types.ts";
import type {Ontology, RelationType} from "../types/ontology-types.ts";
import {
    calculateInferredRelations,
    getPredecessors,
    getSuccessors,
    InferredRelationsMap,
    invertRelations,
    toNaturalName
} from "../stores/utils.ts";
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
    showInferred = true,
    boundaryEntityIri: string | null = null,
) => {
    let nodes: G6Node[] = [];
    let edges: G6Edge[] = [];
    if (!ontology || filterRelationTypes.length === 0) return { nodes, edges };

    // 0. Boundary Filtering
    // We want to keep the entire "branch" that the boundary entity belongs to.
    // This includes the boundary entity itself, all its ancestors, and all its descendants.
    let allowedIris: Set<string> | null = null;
    if (boundaryEntityIri) {
        // Ancestors: Successors in 'partOf' (Child -> Parent -> Root)
        const ancestors = getSuccessors(boundaryEntityIri, ontology.relations as any, ['partOf']);
        // Descendants: Predecessors in 'partOf' (Leaf -> ... -> Child)
        const descendants = getPredecessors(boundaryEntityIri, ontology.relations as any, ['partOf']);

        allowedIris = new Set([boundaryEntityIri, ...Array.from(ancestors), ...Array.from(descendants)]);
    }

    const entityIRItoIdMap = new Map<string, string>();
    ontology.entities.forEach(entity => {
        if (allowedIris && !allowedIris.has(entity.iri)) return;

        const id = entity.iri;
        entityIRItoIdMap.set(entity.iri, id);
        nodes.push({
            id: id,
            label: toNaturalName(entity.name),
            entityType: activeDimension as any,
        });
    });

    const addEdges = (relMap: Record<string, Record<string, string[]>>, isInferred: boolean) => {
        filterRelationTypes.forEach(relationType => {
            let relations = relMap[relationType];
            if (!relations) return;

            if (inverse) {
                relations = invertRelations(relations);
            }

            Object.entries(relations)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([subjectIRI, objectIRIs]) => {
                    const sourceId = entityIRItoIdMap.get(subjectIRI);

                    objectIRIs.forEach((objectIRI, index) => {
                        const targetId = entityIRItoIdMap.get(objectIRI);

                        if (sourceId && targetId) {
                            // IF we are adding inferred edges, SKIP if an edge with same source/target/label already exists
                            if (isInferred) {
                                const exists = edges.some(e => e.source === sourceId && e.target === targetId && e.label === relationType);
                                if (exists) return;
                            }

                            edges.push({
                                id: `${sourceId}-${relationType}-${targetId}-${index}${isInferred ? '-inferred' : ''}`,
                                source: sourceId,
                                target: targetId,
                                label: relationType,
                                isInferred,
                            });
                        }
                    });
                });
        });
    };

    // 1. Add Original Relations
    addEdges(ontology.relations as any, false);

    // 2. Add Inferred Relations if enabled
    let inferredMap: InferredRelationsMap = {};
    if (showInferred) {
        inferredMap = calculateInferredRelations(ontology);

        // Convert InferredRelationsMap to standard format for addEdges
        const simpleInferred: Record<string, Record<string, string[]>> = {};
        Object.entries(inferredMap).forEach(([relType, subjects]) => {
            simpleInferred[relType] = {};
            Object.entries(subjects).forEach(([subj, targets]) => {
                simpleInferred[relType][subj] = targets.map(t => t.targetIri);
            });
        });

        addEdges(simpleInferred, true);
    }

    if (focusMode !== 'global' && selectedEntityIri) {
        const irisToKeep = new Set<string>([selectedEntityIri]);

        // Combine relations for successor/predecessor calculation to ensure focus works with inferred
        const allRelations: Record<string, Record<string, string[]>> = {};

        // Rel types from both original and inferred
        const allRelTypes = Array.from(new Set([
            ...Object.keys(ontology.relations),
            ...(showInferred ? Object.keys(inferredMap) : [])
        ])) as RelationType[];

        allRelTypes.forEach(type => {
            const original = ontology.relations[type] || {};
            allRelations[type] = { ...original };

            if (showInferred && inferredMap[type]) {
                Object.entries(inferredMap[type]).forEach(([subject, targets]) => {
                    const targetIris = targets.map(t => t.targetIri);
                    allRelations[type][subject] = Array.from(new Set([...(allRelations[type][subject] || []), ...targetIris]));
                });
            }
        });

        const relationsToFollow = filterRelationTypes;

        if (focusMode === 'ancestry') {
            const successors = getSuccessors(selectedEntityIri, allRelations, relationsToFollow);
            const predecessors = getPredecessors(selectedEntityIri, allRelations, relationsToFollow);
            successors.forEach(iri => irisToKeep.add(iri));
            predecessors.forEach(iri => irisToKeep.add(iri));
        } else if (focusMode === 'local') {
            filterRelationTypes.forEach(relationType => {
                const directSuccessors = allRelations[relationType]?.[selectedEntityIri] || [];
                directSuccessors.forEach(iri => irisToKeep.add(iri));

                const inverted = invertRelations(allRelations[relationType] || {});
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
