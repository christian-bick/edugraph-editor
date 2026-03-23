import React, {useEffect, useMemo, useRef} from 'react';
import {getGraphData} from "../../../graphs/taxonomy.ts";
import {useCurrentOntologyStore, useOntologyStore} from "../../../stores/ontology-store.ts";
import {useBranchStore} from "../../../stores/branch-store.ts";
import './GraphExplorer.scss';
import {useSelectedEntityStore} from "../../../stores/selected-entity-store.ts";
import {Sidebar} from "./Sidebar/Sidebar.tsx";
import {renderTaxonomyDagre} from "../../../graphs/taxonomy-dagre.ts";
import {ActionSidebar} from "./ActionSidebar/ActionSidebar.tsx";
import {useFocusStore} from "../../../stores/focus-store.ts";
import {Graph} from "@antv/g6";

export const GraphExplorer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<Graph>(null);
    const dataRef = useRef<any>(null);
    const observerRef = useRef<ResizeObserver | null>(null);

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

    const renderWithinBoundaries = async () => {
        if (graphRef.current && containerRef.current) {
            const {width, height} = containerRef.current.getBoundingClientRect();
            graphRef.current.resize(width, height);
            await graphRef.current.render();
        }
    };

    const getData = () => {
        let data;
        if (activePerspective === 'Progression') {
            data = getGraphData(ontology, activeDimension, 'expands', true, true, activeFocus, selectedEntityIri, false);
        } else {
            data = getGraphData(ontology, activeDimension, 'partOf', false, true, activeFocus, selectedEntityIri, true);
        }
        return data;
    }

    // 1. Lifecycle Effect: Manages the G6 Instance (Creation/Destruction)
    useEffect(() => {
        if (!containerRef.current || !ontology || loading) return;

        let isCancelled = false;

        const initGraph = async () => {
            // Cleanup previous instance if any
            observerRef.current?.disconnect();
            if (graphRef.current) {
                graphRef.current.destroy();
                graphRef.current = null;
            }

            const data = getData();
            dataRef.current = data;

            const graph = renderTaxonomyDagre(containerRef.current!, data);
            graphRef.current = graph;

            const observer = new ResizeObserver(renderWithinBoundaries);
            observer.observe(containerRef.current);
            observerRef.current = observer;

            // Handle node selection
            graph.on('node:click', (evt: any) => {
                const {id} = evt.target;
                setSelectedEntityIri(id);
            });

            // Handle canvas click to deselect
            graph.on('canvas:click', () => {
                if (activeFocus === 'global') {
                    setSelectedEntityIri(null);
                }
            });

            graph.setOptions({
                autoFit: false,
                animation: { duration: 500 },
            });

            await renderWithinBoundaries();

            if (isCancelled) {
                graph.destroy();
                observer.disconnect();
                return;
            }

            await graph.zoomTo(0.9, 0.5);

            if (selectedEntityIri) {
                setSelected(graph, selectedEntityIri);
                graph.focusElement(selectedEntityIri, 0.3);
            }
        };

        initGraph();

        return () => {
            isCancelled = true;
            observerRef.current?.disconnect();
            if (graphRef.current) {
                graphRef.current.destroy();
                graphRef.current = null;
            }
        };
    }, [loading, activeDimension, activePerspective, activeBranch]);

    // 2. Update Effect: Manages data, focus, and selection changes
    useEffect(() => {
        const graph = graphRef.current;
        if (!graph || loading || !ontology) return;

        const updateGraph = async () => {
            const data = getData();
            const hasDataChanged = !isDeepEqual(dataRef.current, data);

            if (hasDataChanged) {
                dataRef.current = data;
                graph.setData(data);
                await graph.render()
            }

            setSelected(graph, selectedEntityIri);
            if (selectedEntityIri) {
                await graph.focusElement(selectedEntityIri, 0.3);
            }
        };

        updateGraph();
    }, [ontology, activeFocus, selectedEntityIri]);

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
