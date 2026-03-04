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

const dimensionColorMap: { [key: string]: string } = {
    'Area': '#fb8500',
    'Ability': '#219ebc',
    'Scope': '#5cb85c',
};

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
const graphToTree = (graphData: { nodes: G6Node[]; edges: G6Edge[] }, dimension: string): any => {
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
        return {id: 'virtual-root', label: dimension, children: roots};
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

const balanceMindmapChildren = (rootChildren: any[]): Set<string> => {
    const countNodes = (node: any): number => {
        if (!node.children || node.children.length === 0) {
            return 1;
        }
        return 1 + node.children.reduce((acc: number, child: any) => acc + countNodes(child), 0);
    };

    // Calculate subtree size for each child
    const childrenWithSize = rootChildren.map((child: any) => ({
        ...child,
        subtreeSize: countNodes(child),
    }));

    // Sort children by subtree size in descending order
    childrenWithSize.sort((a: any, b: any) => b.subtreeSize - a.subtreeSize);

    const leftChildrenNodes: any[] = [];
    const rightChildrenNodes: any[] = [];
    let leftSize = 0;
    let rightSize = 0;

    // Distribute children to left and right groups
    childrenWithSize.forEach((child: any) => {
        if (leftSize <= rightSize) {
            leftChildrenNodes.push(child);
            leftSize += child.subtreeSize;
        } else {
            rightChildrenNodes.push(child);
            rightSize += child.subtreeSize;
        }
    });

    return new Set(leftChildrenNodes.map((child: any) => child.id));
};

export const renderTaxonomyMindmap = async (
    container: HTMLElement,
    graphData: { nodes: G6Node[]; edges: G6Edge[] },
    dimension: string,
): Promise<any> => {

    const treeData = graphToTree(graphData, dimension);

    if (!treeData) {
        console.error("Failed to convert graph data to tree data.");
        return null;
    }
    const rootId = treeData.id;
    const rootChildren = treeData.children || [];
    const leftChildren = balanceMindmapChildren(rootChildren);

    const getNodeSide = (nodeId: string) => {
        if (leftChildren.has(nodeId)) {
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
                const isRoot = d.id === rootId;
                const direction = getNodeSide(d.id);
                const rootNodeStyle = { ...RootNodeStyle, fill: dimensionColorMap[dimension] || RootNodeStyle.fill };
                return {
                    labelText: d.label,
                    size: getNodeSize(d.label, isRoot),
                    labelBackground: true,
                    labelBackgroundFill: 'transparent',
                    labelPadding: direction === 'left' ? [2, 0, 10, 10] : [2, 10, 10, 0],
                    ...(isRoot ? rootNodeStyle : NodeStyle),
                };
            },
        },
        edge: {
            type: 'mindmap',
            style: {
                lineWidth: 3,
                stroke: dimensionColorMap[dimension] || '#fb8500',
            },
        },
        layout: {
            type: 'mindmap',
            direction: 'H',
            getSide: (node: any) => getNodeSide(node.id),
            getHeight: () => 30,
            getWidth: (node: any) => getNodeWidth(node.data.label, node.id === rootId) + 20,
            getVGap: () => 14,
            getHGap: () => 60,
            animation: false,
        },
        behaviors: ['drag-canvas', 'zoom-canvas', 'drag-node', 'collapse-expand-tree'],
        animation: false,
    });
    await graph.render();
    return graph;
};
