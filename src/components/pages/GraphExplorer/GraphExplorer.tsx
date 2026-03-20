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

            let data;
            if (activePerspective === 'Progression') {
                data = getGraphData(ontology, activeDimension, 'expands', true, true, activeFocus, selectedEntityIri);
            } else {
                data = getGraphData(ontology, activeDimension, 'partOf', false, true, activeFocus, selectedEntityIri);
            }

            dataRef.current = data;

            const adjustGraphSize = () => {
                if (graphRef.current && containerRef.current) {
                    const {width, height} = containerRef.current.getBoundingClientRect();
                    graphRef.current.resize(width, height);
                    graphRef.current.render();
                }
            };

            const observer = new ResizeObserver(adjustGraphSize);
            observer.observe(containerRef.current);
            observerRef.current = observer;

            let graph;
            if (activePerspective === 'Progression') {
                graph = await renderTaxonomyDagre(containerRef.current!, data);
            } else {
                graph = await renderTaxonomyCompactBox(containerRef.current!, data, activeDimension);
            }

            if (isCancelled) {
                graph.destroy();
                observer.disconnect();
                return;
            }

            graphRef.current = graph;

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

            adjustGraphSize();
            graph.fitView();
            graph.zoomTo(0.9, 0.5);

            if (selectedEntityIri) {
                setSelected(graph, selectedEntityIri);
                await graph.focusElement(selectedEntityIri, 0.3);
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
    }, [loading, ontology, activeDimension, activePerspective, activeBranch, activeFocus]);

    // 2. Update Effect: Manages data, focus, and selection changes
    useEffect(() => {
        const graph = graphRef.current;
        if (!graph || loading || !ontology) return;

        const updateGraph = async () => {
            let data;
            if (activePerspective === 'Progression') {
                data = getGraphData(ontology, activeDimension, 'expands', true, true, activeFocus, selectedEntityIri);
            } else {
                data = getGraphData(ontology, activeDimension, 'partOf', false, true, activeFocus, selectedEntityIri);
            }

            const hasDataChanged = !isDeepEqual(dataRef.current, data);

            if (hasDataChanged) {
                dataRef.current = data;
                graph.setData(data);
                await graph.render();
            }

            setSelected(graph, selectedEntityIri);
            if (selectedEntityIri) {
                await graph.focusElement(selectedEntityIri, 0.3);
            }
        };

        updateGraph();
    }, [selectedEntityIri]);

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
