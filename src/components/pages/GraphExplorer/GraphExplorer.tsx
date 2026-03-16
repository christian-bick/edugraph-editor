import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {getGraphData} from "../../../graphs/taxonomy.ts";
import {useOntologyStore} from "../../../stores/ontology-store.ts";
import {renderTaxonomyCompactBox} from "../../../graphs/taxonomy-compact-box.ts";
import {useBranchStore} from "../../../stores/branch-store.ts";
import './GraphExplorer.scss';
import {useSelectedEntityStore} from "../../../stores/selected-entity-store.ts";
import {Sidebar} from "./Sidebar/Sidebar.tsx";
import {renderTaxonomyDagre} from "../../../graphs/taxonomy-dagre.ts";

export const GraphExplorer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null); // Store the G6 graph instance
    const {ontologies, loading, error} = useOntologyStore();
    const { activeBranch, activeDimension, activePerspective } = useBranchStore();
    const { setSelectedEntityIri } = useSelectedEntityStore();

    const ontology = useMemo(() => {
        return ontologies[activeDimension as keyof typeof ontologies];
    }, [ontologies, activeDimension]);

    const handleNodeClick = useCallback((entityIri: string) => {
        setSelectedEntityIri(entityIri);
    }, [setSelectedEntityIri]);

    useEffect(() => {
        setSelectedEntityIri(null);
    }, [activeBranch, activeDimension, activePerspective, setSelectedEntityIri]);

    useEffect(() => {
        if (!containerRef.current || !ontology || loading) return;

        let resizeObserver: ResizeObserver | null = null;
        let isMounted = true;

        const initGraph = async () => {
            let data, graph;

            if (activePerspective === 'Progression') {
                data = getGraphData(ontology, activeDimension, 'expands', true, true);
                graph = await renderTaxonomyDagre(containerRef.current!, data, handleNodeClick);
            } else {
                data = getGraphData(ontology, activeDimension, 'partOf', false, true);
                graph = await renderTaxonomyCompactBox(containerRef.current!, data, activeDimension, handleNodeClick);
            }

            // If unmounted while waiting for render to resolve, destroy immediately
            if (!isMounted) {
                graph.destroy();
                return;
            }

            graphRef.current = graph;

            const adjustGraph = () => {
                const currentGraph = graphRef.current;
                if (currentGraph && containerRef.current) {
                    const {width, height} = containerRef.current.getBoundingClientRect();
                    currentGraph.setSize(width, height);
                    currentGraph.fitView();
                }
            };

            // Set up resize observer once layout is done and variables are assigned
            graph.on('afterlayout', () => {
                if (!isMounted || !containerRef.current) return;
                adjustGraph();

                if (!resizeObserver) {
                    resizeObserver = new ResizeObserver(() => {
                        adjustGraph();
                    });
                    resizeObserver.observe(containerRef.current);
                }
            });

            // Force an initial adjustment in case afterlayout was missed
            adjustGraph();
        };

        initGraph();

        return () => {
            isMounted = false;
            if (resizeObserver && containerRef.current) {
                resizeObserver.unobserve(containerRef.current);
                resizeObserver.disconnect();
            }
            if (graphRef.current) {
                graphRef.current.destroy();
                graphRef.current = null;
            }
        };
    }, [ontology, loading, activeDimension, activePerspective, handleNodeClick]);

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
