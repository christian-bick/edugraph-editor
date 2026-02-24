import * as G6 from '@antv/g6';
import type {G6Edge, G6Node} from '../types/graph-types.ts';

export const renderTaxonomyTree = async (
    container: HTMLElement,
    data: { nodes: G6Node[]; edges: G6Edge[] },
    onLayoutEnd?: () => void
): Promise<any> => {
    const graph = new G6.Graph({
        data,
        container: container,
        width: container.scrollWidth,
        height: container.scrollHeight || 500, // Fallback height
        fitView: true,
        autoFit: 'center',
        node: {
            type: 'rect',
            style: {
                size: [160, 30],
                radius: 8,
                iconText: (d: any) => d.label,
                iconFontSize: 12,
                labelBackground: true,
                ports: [{placement: 'top'}, {placement: 'bottom'}],
            },
            palette: {
                field: (d: any) => d.combo,
            },
        },
        edge: {
            type: 'cubic-vertical',
            style: {
                endArrow: true,
            },
        },
        combo: {
            type: 'rect',
            style: {
                radius: 8,
                labelText: (d: any) => d.id,
            },
        },
        layout: {
            type: 'antv-dagre',
            ranksep: 120,
            nodesep: 50,
            sortByCombo: true,
        },
        behaviors: ['drag-canvas', 'zoom-canvas', 'collapse-expand-tree'],
    });

    if (onLayoutEnd) {
        graph.on('afterlayout', onLayoutEnd);
    }

    await graph.render();
    return graph;
};
