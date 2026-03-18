import { Graph } from '@antv/g6';
import type { G6Edge, G6Node } from '../types/graph-types.ts';

const dimensionColorMap: { [key: string]: string } = {
    'Area': '#fb8500',
    'Ability': '#219ebc',
    'Scope': '#5cb85c',
};

export const renderTaxonomyDagre = async (
    container: HTMLElement,
    graphData: { nodes: G6Node[]; edges: G6Edge[] },
): Promise<any> => {
    const graph = new Graph({
        container,
        data: graphData,
        autoFit: 'view',
        node: {
            type: 'rect',
            style: (d: any) => {
                const entityType = d.entityType as string;
                const color = dimensionColorMap[entityType] || '#666';
                return {
                    size: [180, 40],
                    radius: 8,
                    labelText: d.label,
                    labelPlacement: 'center',
                    labelFontSize: 12,
                    labelFill: '#000',
                    fill: '#fff',
                    stroke: color,
                    lineWidth: 1.5,
                    ports: [{ placement: 'top' }, { placement: 'bottom' }, { placement: 'left' }, { placement: 'right' }],
                };
            },
            state: {
                selected: {
                    labelFill: '#fff',
                    stroke: 'red',
                    fill: 'salmon',
                    lineWidth: 3,
                },
            }
        },
        edge: {
            type: 'polyline',
            style: {
                endArrow: false,
                stroke: '#ccc'
            },
        },
        layout: {
            type: 'antv-dagre',
            rankdir: 'LR',
            ranksep: 40,
            nodesep: 40,
            ranker: 'network-simplex',
            controlPoints: true,
            sortByCombo: true,
        },
        behaviors: ['drag-canvas', 'zoom-canvas', 'drag-node'],
    });

    await graph.render();
    return graph;
};
