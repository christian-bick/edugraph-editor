import {Rect, Text} from '@antv/g';
import {
    BaseNode,
    CubicHorizontal,
    ExtensionCategory,
    Graph, GraphEvent,
    iconfont,
    idOf,
    register,
    treeToGraphData
} from '@antv/g6';
import type {G6Edge, G6Node} from '../types/graph-types.ts';

// --- START: Code adapted from user-provided example.js ---

const style = document.createElement('style');
style.innerHTML = `@import url('${iconfont.css}');`;
document.head.appendChild(style);

const RootNodeStyle = {
    fill: '#fb8500',
    labelFill: '#fff',
    labelFontSize: 24,
    labelFontWeight: 600,
    labelOffsetY: 8,
    labelPlacement: 'center',
    ports: [{placement: 'right'}, {placement: 'left'}],
    radius: 8,
};

const NodeStyle = {
    fill: 'transparent',
    labelPlacement: 'center',
    labelFontSize: 16,
    ports: [{placement: 'right-bottom'}, {placement: 'left-bottom'}],
};

let textShape: Text;
const measureText = (text: any) => {
    if (!textShape) textShape = new Text({style: text});
    textShape.attr(text);
    return textShape.getBBox().width;
};

const getNodeWidth = (nodeId: string, isRoot: boolean) => {
    const padding = isRoot ? 40 : 30;
    const nodeStyle = isRoot ? RootNodeStyle : NodeStyle;
    return measureText({text: nodeId, fontSize: nodeStyle.labelFontSize, fontFamily: 'Gill Sans'}) + padding;
};

const getNodeSize = (nodeId: string, isRoot: boolean): [number, number] => {
    const width = getNodeWidth(nodeId, isRoot);
    const height = isRoot ? 48 : 32;
    return [width, height];
};

/**
 * Custom helper to convert graph data to a tree structure.
 */
const graphToTree = (graphData: { nodes: G6Node[]; edges: G6Edge[] }): any => {
    const nodeMap = new Map(graphData.nodes.map(n => [n.id, {...n, data: {...n}, children: []}]));
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

    // If there are multiple roots, create a virtual root for the mindmap
    if (roots.length > 1) {
        return {id: 'virtual-root', label: 'Mindmap', children: roots};
    }

    // Return the single root
    return roots[0];
};

class MindmapNode extends BaseNode {
    static defaultStyleProps = {
        showIcon: false,
    };

    constructor(options: any) {
        Object.assign(options.style, MindmapNode.defaultStyleProps);
        super(options);
    }

    getKeyStyle(attributes: any) {
        const [width, height] = this.getSize(attributes);
        const keyShape = super.getKeyStyle(attributes);
        return {width, height, ...keyShape};
    }

    drawKeyShape(attributes: any, container: any) {
        const keyStyle = this.getKeyStyle(attributes);
        return this.upsert('key', Rect, keyStyle, container);
    }

    render(attributes: any = this.parsedAttributes, container: any = this) {
        super.render(attributes, container);
    }
}

class MindmapEdge extends CubicHorizontal {

    getKeyPath(attributes: any) {
        const path = super.getKeyPath(attributes);
        if (!this.targetNode || !this.sourceNode) return path;
        const labelWidth = this.targetNode.getBBox().width;

        const [, tp] = this.getEndpoints(attributes);
        const sign = this.sourceNode.getCenter()[0] < this.targetNode.getCenter()[0] ? 1 : -1;
        return [...path, ['L', tp[0] + labelWidth * sign, tp[1]]];
    }
}

register(ExtensionCategory.NODE, 'mindmap', MindmapNode);
register(ExtensionCategory.EDGE, 'mindmap', MindmapEdge);

// --- END: Code adapted from user-provided example.js ---

export const renderTaxonomyMindmap = async (
    container: HTMLElement,
    graphData: { nodes: G6Node[]; edges: G6Edge[] },
): Promise<any> => {

    const treeData = graphToTree(graphData);

    if (!treeData) {
        console.error("Failed to convert graph data to tree data.");
        return null;
    }
    const rootId = treeData.id;
    const rootChildren = treeData.children || [];
    const leftChildren = new Set(rootChildren.slice(0, rootChildren.length / 2).map((child: any) => child.id));

    const getNodeSide = (nodeId: string, parentModels: any[]) => {
        const parentExists = parentModels && parentModels.length > 0;
        if (parentExists && parentModels[0].id === rootId && leftChildren.has(nodeId)) {
            return 'left';
        }
        return 'right';
    };

    const graph = new Graph({
        container,
        data: treeToGraphData(treeData),
        node: {
            type: 'mindmap',
            style: function (d: any) {
                const parentModels = this.getParentData(d.id, 'tree');
                const direction = getNodeSide(d.id, parentModels);
                const isRoot = d.id === rootId;
                return {
                    direction,
                    labelText: d.label,
                    size: getNodeSize(d.label, isRoot),
                    labelFontFamily: 'Gill Sans',
                    labelBackground: true,
                    labelBackgroundFill: 'transparent',
                    labelPadding: direction === 'left' ? [2, 0, 10, 10] : [2, 10, 10, 0],
                    ...(isRoot ? RootNodeStyle : NodeStyle),
                };
            },
        },
        edge: {
            type: 'mindmap',
            style: {
                lineWidth: 3,
                stroke: '#fb8500',
            },
        },
        layout: {
            type: 'mindmap',
            direction: 'H',
            getHeight: () => 30,
            getWidth: (node: any) => getNodeWidth(node.data.label, node.id === rootId) + 20,
            getVGap: () => 6,
            getHGap: () => 60,
            animation: false,
        },
        behaviors: ['drag-canvas', 'zoom-canvas', 'drag-node', 'collapse-expand-tree'],
        animation: false,
    });
    await graph.render();
    return graph;
};
