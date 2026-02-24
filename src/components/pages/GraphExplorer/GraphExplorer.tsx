import React, { useEffect, useRef } from 'react';
import { getGraphData } from "../../../graphs/taxonomy.ts";
import { useOntologyStore } from "../../../stores/ontology-store.ts";
import { renderTaxonomyTree } from "../../../graphs/taxonomy-tree.ts";

export const GraphExplorer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null); // Store the G6 graph instance
    const { ontology, loading, error, fetchOntology } = useOntologyStore();

    useEffect(() => {
        fetchOntology();
    }, [fetchOntology]);

    useEffect(() => {
        if (!containerRef.current || !ontology || loading) return;

        let resizeObserver: ResizeObserver | null = null;
        let isMounted = true;

        const initGraph = async () => {
            const data = getGraphData(ontology, 'Area', 'hasPart');

            // Pass the container immediately
            const graph = await renderTaxonomyTree(containerRef.current!, data);

            // If unmounted while waiting for render to resolve, destroy immediately
            if (!isMounted) {
                graph.destroy();
                return;
            }

            graphRef.current = graph;

            const adjustGraph = () => {
                const currentGraph = graphRef.current;
                if (currentGraph && containerRef.current) {
                    const { width, height } = containerRef.current.getBoundingClientRect();
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
    }, [ontology, loading]);

    if (loading) return <div>Loading ontology...</div>;
    if (error) return <div>Error loading ontology: {error}</div>;
    if (!ontology) return <div>No ontology data available.</div>;

    return (
        <div
            ref={containerRef}
            className="graph-explorer"
            style={{ width: '100%', height: 'calc(100vh - 60px)', background: '#f5f5f5', overflow: 'hidden' }}
        ></div>
    );
};

export default GraphExplorer;
