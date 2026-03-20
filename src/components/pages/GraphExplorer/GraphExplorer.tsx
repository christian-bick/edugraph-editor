import React, {useEffect, useMemo, useRef} from 'react';
import {getGraphData} from "../../../graphs/taxonomy.ts";
import {useCurrentOntologyStore, useOntologyStore} from "../../../stores/ontology-store.ts";
import {renderTaxonomyCompactBox} from "../../../graphs/taxonomy-compact-box.ts";
import {useBranchStore} from "../../../stores/branch-store.ts";
import './GraphExplorer.scss';
import {useSelectedEntityStore} from "../../../stores/selected-entity-store.ts";
import {Sidebar} from "./Sidebar/Sidebar.tsx";
import {renderTaxonomyDagre} from "../../../graphs/taxonomy-dagre.ts";
import {ActionSidebar} from "./ActionSidebar/ActionSidebar.tsx";
import {useFocusStore} from "../../../stores/focus-store.ts";

export const GraphExplorer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null);
    const dataRef = useRef<any>(null);
    const selectedRef = useRef<string>(null);
    const dimensionRef = useRef<string>(null);
    const perspectiveRef = useRef<string>(null);
    const branchRef = useRef<string>(null);
    const focusRef = useRef<string>(null)

    const {loading, error} = useOntologyStore();
    const {ontologies} = useCurrentOntologyStore();
    const {activeBranch, activeDimension, activePerspective} = useBranchStore();
    const {selectedEntityIri, setSelectedEntityIri} = useSelectedEntityStore();
    const {activeFocus} = useFocusStore();

    const ontology = useMemo(() => {
        return ontologies[activeDimension as keyof typeof ontologies];
    }, [ontologies, activeDimension]);

    useEffect(() => {
        setSelectedEntityIri(null);
    }, [activeBranch, activeDimension, setSelectedEntityIri]);

    const setSelected = (graph: any, selectedEntityIri: string | null) => {
        let selectedNode = null;
        const allNodes = graph.getNodeData();
        allNodes.forEach((node: { id: string | null; }) => {
            const states = graph.getElementState(node.id);
            if (states.includes('selected')) {
                // Remove the state from previously selected nodes
                graph.setElementState(node.id, []);
            }
            if (node.id === selectedEntityIri) {
                selectedNode = node
            }
        });

        if (selectedNode) {
            graph.setElementState(selectedEntityIri, 'selected');
        }
    };

    useEffect(() => {
        if (!containerRef.current || !ontology || loading) return;

        let resizeObserver: ResizeObserver | null = null;
        let isCancelled = false;

        const hasBranchChanged = branchRef.current !== activeBranch
        branchRef.current = activeBranch;
        const hasDimensionChanged = dimensionRef.current !== activeDimension
        dimensionRef.current = activeDimension;
        const hasPerspectiveChanged = perspectiveRef.current !== activePerspective
        perspectiveRef.current = activePerspective;
        const hasFocusChanged = focusRef.current !== activeFocus
        focusRef.current = activeFocus;
        const hasSelectedChanged = selectedRef.current !== selectedEntityIri
        selectedRef.current = selectedEntityIri;

        let data
        if (activePerspective === 'Progression') {
            data = getGraphData(ontology, activeDimension, 'expands', true, true, activeFocus, selectedEntityIri);
        } else {
            data = getGraphData(ontology, activeDimension, 'partOf', false, true, activeFocus, selectedEntityIri);
        }

        const hasDataChanged = !isDeepEqual(dataRef.current, data)
        if (hasDataChanged) {
            dataRef.current = data;
        }

        const initGraph = async () => {
            const adjustGraphSize = () => {
                if (graphRef.current && containerRef.current) {
                    const {width, height} = containerRef.current.getBoundingClientRect();
                    graphRef.current.resize(width, height);
                    graphRef.current.render();
                }
            };

            resizeObserver = new ResizeObserver(adjustGraphSize);
            resizeObserver.observe(containerRef.current);

            let graph;
            if (activePerspective === 'Progression') {
                graph = await renderTaxonomyDagre(containerRef.current!, data);
            } else {
                graph = await renderTaxonomyCompactBox(containerRef.current!, data, activeDimension);
            }

            if (isCancelled) {
                graph.destroy();
                return;
            }

            // Handle node selection
            graph.on('node:click', (evt: any) => {
                const {id} = evt.target;
                setSelectedEntityIri(id);
            });

            // Handle canvas click to deselect
            graph.on('canvas:click', () => {
                setSelectedEntityIri(null);
            });

            graph.setOptions({
                autoFit: false,
                animation: {
                    duration: 500,
                },
            })

            graphRef.current = graph

            adjustGraphSize();
            graph.fitView();
            graph.zoomTo(0.9, 0.5);

            if ((hasSelectedChanged || hasFocusChanged) && selectedEntityIri) {
                setSelected(graphRef.current, selectedEntityIri);
                await graphRef.current.focusElement(selectedEntityIri, 0.3);
            }
        };

        const updateGraph = async () => {
            if (hasDataChanged) {
                graphRef.current.setData(data);
            }
            if (hasSelectedChanged) {
                setSelected(graphRef.current, selectedEntityIri);
            }
            if (hasDataChanged && data) {
                await graphRef.current.render();
            }
            if (hasSelectedChanged && selectedEntityIri) {
                await graphRef.current.focusElement(selectedEntityIri, 0.3);
            }
        }

        if (!graphRef.current || hasBranchChanged || hasDimensionChanged || hasPerspectiveChanged) {
            initGraph();
        } else {
            updateGraph();
        }

        return () => {
            isCancelled = true;
            resizeObserver?.disconnect();
            if (graphRef.current) {
                graphRef.current.destroy();
                graphRef.current = null;
            }
        };
    }, [loading, ontology, activeDimension, activePerspective, activeFocus, activeBranch, selectedEntityIri, setSelectedEntityIri]);

    if (loading) return <div>Loading ontology...</div>;
    if (error) return <div>Error loading ontology: {error}</div>;
    if (!ontology) return <div>No ontology data available.</div>;

    return (
        <div className="graph-explorer-wrapper">
            <ActionSidebar/>
            <div
                ref={containerRef}
                className="graph-explorer"
            ></div>
            <Sidebar/>
        </div>
    );
};

const isDeepEqual = (object1, object2) => {
    if (object1 == null) {
        return object2 == null;
    } else if (object2 == null) {
        return false;
    }

    const objKeys1 = Object.keys(object1);
    const objKeys2 = Object.keys(object2);

    if (objKeys1.length !== objKeys2.length) return false;

    for (var key of objKeys1) {
        const value1 = object1[key];
        const value2 = object2[key];

        const isObjects = isObject(value1) && isObject(value2);

        if ((isObjects && !isDeepEqual(value1, value2)) ||
            (!isObjects && value1 !== value2)
        ) {
            return false;
        }
    }
    return true;
};

const isObject = (object) => {
    return object != null && typeof object === "object";
};

export default GraphExplorer;
