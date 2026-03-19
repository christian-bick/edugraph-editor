import React, {useEffect, useMemo, useRef} from 'react';
import {getGraphData} from "../../../graphs/taxonomy.ts";
import {useCurrentOntologyStore, useOntologyStore} from "../../../stores/ontology-store.ts";
import {renderTaxonomyCompactBox} from "../../../graphs/taxonomy-compact-box.ts";
import {useBranchStore} from "../../../stores/branch-store.ts";
import './GraphExplorer.scss';
import {useSelectedEntityStore} from "../../../stores/selected-entity-store.ts";
import {Sidebar} from "./Sidebar/Sidebar.tsx";
import {renderTaxonomyDagre} from "../../../graphs/taxonomy-dagre.ts";

export const GraphExplorer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null); // Store the G6 graph instance
    const { loading, error } = useOntologyStore();
    const { ontologies } = useCurrentOntologyStore();
    const { activeBranch, activeDimension, activePerspective } = useBranchStore();
    const { selectedEntityIri, setSelectedEntityIri } = useSelectedEntityStore();

    const ontology = useMemo(() => {
        return ontologies[activeDimension as keyof typeof ontologies];
    }, [ontologies, activeDimension]);

    useEffect(() => {
        setSelectedEntityIri(null);
    }, [activeBranch, activeDimension, setSelectedEntityIri]);

    useEffect(() => {
        const graph = graphRef?.current;
        if (!graph) {
            return;
        }
        let selectedInGraph = false;
        const allNodes = graph.getNodeData();
        allNodes.forEach((node: { id: string | null; }) => {
            const states = graph.getElementState(node.id);
            if (states.includes('selected')) {
                // Remove the state from previously selected nodes
                graph.setElementState(node.id, []);
            }
            if (node.id === selectedEntityIri) {
                selectedInGraph = true
            }
        });

        if (selectedInGraph) {
            graph.setElementState(selectedEntityIri, 'selected');
        }
    }, [selectedEntityIri]);

    useEffect(() => {
        if (!containerRef.current || !ontology || loading) return;

        let resizeObserver: ResizeObserver | null = null;
        let isMounted = true;

        const initGraph = async () => {
            let data, graph;

            if (activePerspective === 'Progression') {
                data = getGraphData(ontology, activeDimension, 'expands', true, true);
                graph = await renderTaxonomyDagre(containerRef.current!, data);
            } else {
                data = getGraphData(ontology, activeDimension, 'partOf', false, true);
                graph = await renderTaxonomyCompactBox(containerRef.current!, data, activeDimension);
            }

            if (!isMounted || !graph) {
                graph?.destroy();
                return;
            }

            graphRef.current = graph;

            // Handle node selection
            graph.on('node:click', (evt: any) => {
                const { id } = evt.target;
                setSelectedEntityIri(id);
            });

            // Handle canvas click to deselect
            graph.on('canvas:click', () => {
                setSelectedEntityIri(null);
            });

            const adjustGraphSize = () => {
                if (graphRef.current && containerRef.current) {
                    const {width, height} = containerRef.current.getBoundingClientRect();
                    graphRef.current.resize(width, height);
                    graphRef.current.render();
                }
            };

            graph.on('afterlayout', () => {
                if (!isMounted) return;
                graph.fitView();
            });

            if (containerRef.current) {
                resizeObserver = new ResizeObserver(adjustGraphSize);
                resizeObserver.observe(containerRef.current);
            }

            adjustGraphSize();
        };

        initGraph();

        return () => {
            isMounted = false;
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (graphRef.current) {
                graphRef.current.destroy();
                graphRef.current = null;
            }
        };
    }, [ontology, loading, activeDimension, activePerspective, setSelectedEntityIri]);

    if (loading) return <div>Loading ontology...</div>;
    if (error) return <div>Error loading ontology: {error}</div>;
    if (!ontology) return <div>No ontology data available.</div>;

    return (
        <div className="graph-explorer-wrapper">
            <div
                ref={containerRef}
                className="graph-explorer"
            ></div>
            <Sidebar />
        </div>
    );
};

export default GraphExplorer;
