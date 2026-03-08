import { Graph, treeToGraphData } from '@antv/g6';
import type { G6Edge, G6Node } from '../types/graph-types.ts';

const dimensionColorMap: { [key: string]: string } = {
    'Area': '#fb8500',
    'Ability': '#219ebc',
    'Scope': '#5cb85c',
};

/**
 * Custom helper to convert graph data to a tree structure.
 */
const graphToTree = (graphData: { nodes: G6Node[]; edges: G6Edge[] }, dimension: string): any => {
    const nodeMap = new Map(graphData.nodes.map(n => [n.id, { ...n, data: { ...n }, children: [] }]));
    const hasParent = new Set();

    // Iterate over edges to build the hierarchy
    graphData.edges.forEach(edge => {
        const parent = nodeMap.get(edge.source);
        const child = nodeMap.get(edge.target);

        // IMPORTANT: Check if the child already has a parent assigned.
        // This prevents creating duplicates if the graph is a DAG.
        if (parent && child && !hasParent.has(child.id)) {
            parent.children.push(child);
            hasParent.add(child.id);
        }
    });

    // Find the root nodes (nodes that were never a target)
    const roots: any[] = [];
    graphData.nodes.forEach(n => {
        if (!hasParent.has(n.id)) {
            roots.push(nodeMap.get(n.id));
        }
    });

    // If there are multiple roots, create a virtual root
    if (roots.length > 1) {
        return { id: 'virtual-root', label: dimension, children: roots, data: { entityType: dimension } };
    }

    // Return the single root
    return roots[0];
};

const markSiblingNodes = (node: any) => {
    if (node.children && node.children.length > 0) {
        node.children.forEach((child: any, index: number) => {
            if (!child.data) child.data = {};
            if (index === node.children.length - 1) {
                child.data.isLastSibling = true;
            }
            markSiblingNodes(child);
        });
    }
};

export const renderTaxonomyCompactBox = async (
    container: HTMLElement,
    graphData: { nodes: G6Node[]; edges: G6Edge[] },
    dimension: string,
    onNodeClick: (id: string) => void,
): Promise<any> => {

    const treeData = graphToTree(graphData, dimension);

    if (!treeData) {
        console.error("Failed to convert graph data to tree data.");
        return null;
    }
    const rootId = treeData.id;

    markSiblingNodes(treeData);

    const graph = new Graph({
        container,
        data: treeToGraphData(treeData),
        autoFit: 'view',
        node: {
            type: 'rect',
            style: (d: any) => {
                const isRoot = d.id === rootId;
                const entityType = d.data.entityType as string;
                const color = dimensionColorMap[entityType] || dimensionColorMap[dimension] ||'#666';

                return {
                    size: isRoot ? [200, 50] : [180, 40],
                    radius: 8,
                    labelText: d.label,
                    labelPlacement: 'center',
                    labelFontSize: isRoot ? 20 : 12,
                    labelFontWeight: isRoot ? 'bold' : 'normal',
                    labelFill: isRoot ? '#fff' : '#000',
                    fill: isRoot ? color : '#fff',
                    stroke: color,
                    lineWidth: 1.5,
                    ports: [{ placement: 'left' }, { placement: 'right' }],
                };
            }
        },
        edge: {
            type: 'polyline',
            style: {
                stroke: '#ccc',
                endArrow: false,
            },
        },
        layout: {
            type: 'compact-box',
            direction: 'LR',
            getHeight: (d: any) => (d.id === rootId ? 50 : 40),
            getWidth: (d: any) => (d.id === rootId ? 200 : 180),
            getVGap: (d: any) => {
                if (d.data.isLastSibling) return 24;
                return 12;
            },
            getHGap: () => 50,
        },
        behaviors: ['drag-canvas', 'zoom-canvas'],
        animation: false,
    });

    graph.on('node:click', (event) => {
        const { id } = event.target;
        onNodeClick(id);
    });

    await graph.render();
    return graph;
};
