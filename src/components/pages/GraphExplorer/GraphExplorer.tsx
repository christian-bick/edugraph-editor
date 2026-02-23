import React, { useEffect, useRef } from 'react';
import * as G6 from '@antv/g6';
import {getG6GraphData, useOntologyStore} from "../../../stores/ontology.ts";

export const GraphExplorer: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);
    const graphRef = useRef<any>(null); // Store the G6 graph instance
    const { ontology, loading, error, fetchOntology } = useOntologyStore();

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

            const data = getG6GraphData(ontology);

            console.log(data)

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
                    type: 'd3-force',
                    collide: {
                        // Prevent nodes from overlapping by specifying a collision radius for each node.
                        radius: (d) => d.size / 2,
                    },
                },
                defaultNode: {
                    type: 'circle',
                    size: 60,
                    style: {
                        fill: '#C6E5FF',
                        stroke: '#5B8EE4',
                        lineWidth: 2,
                        labelFill: '#000',
                        labelFontSize: 12,
                        labelFontWeight: 'bold',
                        labelTextAlign: 'center',
                        labelTextBaseline: 'middle',
                    },
                },
                defaultEdge: {
                    type: 'line-arrow',
                    style: {
                        stroke: '#999',
                        lineWidth: 1,
                        labelFill: '#555',
                        labelFontSize: 10,
                        labelFontWeight: 'bold',
                        labelTextAlign: 'center',
                        labelTextBaseline: 'middle',
                        labelBackgroundFill: '#fff',
                        labelBackgroundStroke: '#fff',
                        labelBackgroundPadding: [2, 2, 2, 2],
                        labelBackgroundRadius: 2,
                    },
                    labelAutoRotate: true,
                },
                nodeStateStyles: {
                    hover: {
                        fill: '#e2f0fe',
                        stroke: '#348eec',
                        lineWidth: 3,
                    },
                },
                edgeStateStyles: {
                    hover: {
                        stroke: '#348eec',
                        lineWidth: 2,
                    },
                },
            });

            graphRef.current = graph;

            resizeObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;
                    graph.setSize(width, height);
                    graph.fitView();
                }
            });
            resizeObserver.observe(ref.current);

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
        <div ref={ref} className="graph-explorer" style={{ width: '100%', height: 'calc(100vh - 60px)', background: '#f5f5f5' }}></div>
    );
};

export default GraphExplorer;
