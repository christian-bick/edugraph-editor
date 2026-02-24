import React, {useEffect, useRef} from 'react';
import * as G6 from '@antv/g6';
import {getGraphData} from "../../../graphs/taxonomy.ts";
import {useOntologyStore} from "../../../stores/ontology-store.ts";

export const GraphExplorer: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null); // Store the G6 graph instance
    const {ontology, loading, error, fetchOntology} = useOntologyStore();

    useEffect(() => {
        fetchOntology();
    }, [fetchOntology]);

    useEffect(() => {
        let resizeObserver: ResizeObserver;
        const initGraph = async () => {
            if (!ref.current || !ontology || loading) return;

            if (graphRef.current) {
                graphRef.current.destroy(); // Destroy existing graph if any
            }

            const data = getGraphData(ontology, 'Area', 'hasPart');

            // Initialize G6 graph
            const graph = new G6.Graph({
                data,
                container: ref.current,
                width: ref.current.scrollWidth,
                height: ref.current.scrollHeight || 500, // Fallback height
                fitView: true,
                modes: {
                    default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
                },
                layout: {
                    type: 'indented',
                    direction: 'LR',
                    indent: 80,
                    getHeight: () => 16,
                    getWidth: () => 32,
                },
                behaviors: ['drag-canvas', 'zoom-canvas', 'collapse-expand'],
                node: {
                    style: {
                        labelText: (d) => d.label,
                        labelPlacement: 'right',
                        labelBackground: true,
                    },
                    animation: {
                        enter: false,
                    },
                },
                edge: {
                    type: 'polyline',
                    style: {
                        radius: 4,
                        router: {
                            type: 'orth',
                        },
                    },
                    animation: {
                        enter: false,
                    },
                },
            });

            graphRef.current = graph;

            const adjustGraph = (contentRect: DOMRectReadOnly) => {
                const {width, height} = contentRect;
                graph.setSize(width, height);
                graph.fitView();
            }

            // After initial layout is fully settled, fit the view and start listening for resize
            graph.on('afterlayout', () => {
                if (ref.current) {
                    adjustGraph(ref.current.getBoundingClientRect());
                    if (!resizeObserver) {
                        resizeObserver = new ResizeObserver(entries => {
                            for (const entry of entries) {
                                adjustGraph(entry.contentRect);
                            }
                        });
                        resizeObserver.observe(ref.current);
                    }
                }
            });

            await graph.render();
        };

        const timer = setTimeout(initGraph, 0);
        // Cleanup function
        return () => {
            clearTimeout(timer);
            if (resizeObserver && ref.current) {
                resizeObserver.unobserve(ref.current);
            }
            if (graphRef.current) {
                graphRef.current.destroy();
                graphRef.current = null;
            }
        };
    }, [ontology, loading]); // Re-render graph when ontology data changes

    if (loading) return <div>Loading ontology...</div>;
    if (error) return <div>Error loading ontology: {error}</div>;
    if (!ontology) return <div>No ontology data available.</div>;

    return (
        <div ref={ref} className="graph-explorer"
             style={{width: '100%', height: 'calc(100vh - 60px)', background: '#f5f5f5'}}></div>
    );
};

export default GraphExplorer;
