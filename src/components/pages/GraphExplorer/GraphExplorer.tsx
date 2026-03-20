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
    const graphRef = useRef<any>(null); // Store the G6 graph instance
    const { loading, error } = useOntologyStore();
    const { ontologies } = useCurrentOntologyStore();
    const { activeBranch, activeDimension, activePerspective } = useBranchStore();
    const { selectedEntityIri, setSelectedEntityIri } = useSelectedEntityStore();
    const { focus } = useFocusStore();

    const ontology = useMemo(() => {
        return ontologies[activeDimension as keyof typeof ontologies];
    }, [ontologies, activeDimension]);

    useEffect(() => {
        setSelectedEntityIri(null);
    }, [activeBranch, activeDimension, setSelectedEntityIri]);

    const setSelected = (graph: any , selectedEntityIri: string | null) => {
        if (!graph || !selectedEntityIri) {
            return;
        }
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

        const initGraph = async () => {
            let data;

            if (activePerspective === 'Progression') {
                data = getGraphData(ontology, activeDimension, 'expands', true, true);
                graphRef.current = await renderTaxonomyDagre(containerRef.current!, data);
            } else {
                data = getGraphData(ontology, activeDimension, 'partOf', false, true);
                graphRef.current = await renderTaxonomyCompactBox(containerRef.current!, data, activeDimension);
            }

            // Handle node selection
            graphRef.current.on('node:click', (evt: any) => {
                const { id } = evt.target;
                setSelectedEntityIri(id);
            });

            // Handle canvas click to deselect
            graphRef.current.on('canvas:click', () => {
                setSelectedEntityIri(null);
            });

            graphRef.current.setOptions({
                autoFit: false,
                animation: true,
            })

            const adjustGraphSize = () => {
                if (graphRef.current && containerRef.current) {
                    const {width, height} = containerRef.current.getBoundingClientRect();
                    graphRef.current.resize(width, height);
                    graphRef.current.render();
                }
            };

            resizeObserver = new ResizeObserver(adjustGraphSize);
            resizeObserver.observe(containerRef.current);

            adjustGraphSize();
            graphRef.current.fitView();
            graphRef.current.zoomTo(0.9, 0.1);
        };

        const updateGraph = () => {
            let data;
            if (activePerspective === 'Progression') {
                data = getGraphData(ontology, activeDimension, 'expands', true, true, focus, selectedEntityIri);
            } else {
                data = getGraphData(ontology, activeDimension, 'partOf', false, true, focus, selectedEntityIri);
            }
            graphRef.current.setData(data);
            setSelected(graphRef.current, selectedEntityIri)
            graphRef.current.render();
            graphRef.current.focusElement(selectedEntityIri, 0.5);
        }

        if (!graphRef.current) {
            initGraph();
        } else {
            updateGraph();
        }
    }, [loading, ontology, activeDimension, activePerspective, focus, selectedEntityIri, setSelectedEntityIri]);

    if (loading) return <div>Loading ontology...</div>;
    if (error) return <div>Error loading ontology: {error}</div>;
    if (!ontology) return <div>No ontology data available.</div>;

    return (
        <div className="graph-explorer-wrapper">
            <ActionSidebar />
            <div
                ref={containerRef}
                className="graph-explorer"
            ></div>
            <Sidebar />
        </div>
    );
};

export default GraphExplorer;
