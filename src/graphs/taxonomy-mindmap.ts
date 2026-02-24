import { Rect, Text } from '@antv/g';
import {
    Badge,
    BaseBehavior,
    BaseNode,

    CommonEvent,
    CubicHorizontal,
    ExtensionCategory,
    Graph,
    iconfont,
    idOf,
    NodeEvent,
    positionOf,
    register,
    treeToGraphData
} from '@antv/g6';
import type { G6Edge, G6Node } from '../types/graph-types.ts';

// --- START: Code adapted from user-provided example.js ---

const style = document.createElement('style');
style.innerHTML = `@import url('${iconfont.css}');`;
document.head.appendChild(style);

const RootNodeStyle = {
    fill: '#EFF0F0',
    labelFill: '#262626',
    labelFontSize: 24,
    labelFontWeight: 600,
    labelOffsetY: 8,
    labelPlacement: 'center',
    ports: [{ placement: 'right' }, { placement: 'left' }],
    radius: 8,
};

const NodeStyle = {
    fill: 'transparent',
    labelPlacement: 'center',
    labelFontSize: 16,
    ports: [{ placement: 'right-bottom' }, { placement: 'left-bottom' }],
};

const TreeEvent = {
    COLLAPSE_EXPAND: 'collapse-expand',
    ADD_CHILD: 'add-child',
};

let textShape: Text;
const measureText = (text: any) => {
    if (!textShape) textShape = new Text({ style: text });
    textShape.attr(text);
    return textShape.getBBox().width;
};

const getNodeWidth = (nodeId: string, isRoot: boolean) => {
    const padding = isRoot ? 40 : 30;
    const nodeStyle = isRoot ? RootNodeStyle : NodeStyle;
    return measureText({ text: nodeId, fontSize: nodeStyle.labelFontSize, fontFamily: 'Gill Sans' }) + padding;
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
    const nodeMap = new Map(graphData.nodes.map(n => [n.id, { ...n, children: [] }]));
    const roots: any[] = [];

    graphData.nodes.forEach(node => {
        const parentEdge = graphData.edges.find(edge => edge.target === node.id);
        if (parentEdge) {
            const parent = nodeMap.get(parentEdge.source);
            if (parent) {
                // @ts-ignore
                parent.children.push(nodeMap.get(node.id));
            }
        } else {
            roots.push(nodeMap.get(node.id)!);
        }
    });

    if (roots.length > 1) {
        // If there are multiple roots, create a virtual root.
        return { id: 'virtual-root', label: 'Mindmap', children: roots };
    }
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

    get childrenData() {
        return this.context.model.getChildrenData(this.id);
    }

    get rootId() {
        const roots = this.context.model.getRootsData();
        return roots.length > 0 ? idOf(roots[0]) : null;
    }

    isShowCollapse(attributes: any) {
        const { collapsed, showIcon } = attributes;
        return !collapsed && showIcon && this.childrenData.length > 0;
    }

    getCollapseStyle(attributes: any) {
        const { showIcon, direction } = attributes;
        if (!this.isShowCollapse(attributes)) return false;
        const [width, height] = this.getSize(attributes);
        const color = '#1783FF'; // Use static color

        return {
            backgroundFill: color,
            backgroundHeight: 12,
            backgroundWidth: 12,
            cursor: 'pointer',
            fill: '#fff',
            fontFamily: 'iconfont',
            fontSize: 8,
            text: '\ue6e4',
            textAlign: 'center',
            transform: direction === 'left' ? [['rotate', 90]] : [['rotate', -90]],
            visibility: showIcon ? 'visible' : 'hidden',
            x: direction === 'left' ? -6 : width + 6,
            y: height,
        };
    }

    drawCollapseShape(attributes: any, container: any) {
        const iconStyle = this.getCollapseStyle(attributes);
        const btn = this.upsert('collapse-expand', Badge, iconStyle, container);

        this.forwardEvent(btn, CommonEvent.CLICK, (event: any) => {
            event.stopPropagation();
            this.context.graph.emit(TreeEvent.COLLAPSE_EXPAND, {
                id: this.id,
                collapsed: !attributes.collapsed,
            });
        });
    }

    getCountStyle(attributes: any) {
        const { collapsed, direction } = attributes;
        const count = this.context.model.getDescendantsData(this.id).length;
        if (!collapsed || count === 0) return false;
        const [width, height] = this.getSize(attributes);
        const color = '#1783FF'; // Use static color

        return {
            backgroundFill: color,
            backgroundHeight: 12,
            backgroundWidth: 12,
            cursor: 'pointer',
            fill: '#fff',
            fontSize: 8,
            text: count.toString(),
            textAlign: 'center',
            x: direction === 'left' ? -6 : width + 6,
            y: height,
        };
    }

    drawCountShape(attributes: any, container: any) {
        const countStyle = this.getCountStyle(attributes);
        const btn = this.upsert('count', Badge, countStyle, container);

        this.forwardEvent(btn, CommonEvent.CLICK, (event: any) => {
            event.stopPropagation();
            this.context.graph.emit(TreeEvent.COLLAPSE_EXPAND, {
                id: this.id,
                collapsed: false,
            });
        });
    }

    forwardEvent(target: any, type: any, listener: any) {
        if (target && !Reflect.has(target, '__bind__')) {
            Reflect.set(target, '__bind__', true);
            target.addEventListener(type, listener);
        }
    }

    getKeyStyle(attributes: any) {
        const [width, height] = this.getSize(attributes);
        const keyShape = super.getKeyStyle(attributes);
        return { width, height, ...keyShape };
    }

    drawKeyShape(attributes: any, container: any) {
        const keyStyle = this.getKeyStyle(attributes);
        return this.upsert('key', Rect, keyStyle, container);
    }

    render(attributes: any = this.parsedAttributes, container: any = this) {
        super.render(attributes, container);
        this.drawCollapseShape(attributes, container);
        this.drawCountShape(attributes, container);
    }
}

class MindmapEdge extends CubicHorizontal {
    get rootId() {
        const roots = this.context.model.getRootsData();
        return roots.length > 0 ? idOf(roots[0]) : null;
    }

    getKeyPath(attributes: any) {
        const path = super.getKeyPath(attributes);
        if (!this.targetNode || !this.sourceNode) return path;
        const isRoot = this.targetNode.id === this.rootId;
        const labelWidth = getNodeWidth(this.targetNode.id, isRoot);

        const [, tp] = this.getEndpoints(attributes);
        const sign = this.sourceNode.getCenter()[0] < this.targetNode.getCenter()[0] ? 1 : -1;
        return [...path, ['L', tp[0] + labelWidth * sign, tp[1]]];
    }
}

class CollapseExpandTree extends BaseBehavior {
    constructor(context: any, options: any) {
        super(context, options);
        this.bindEvents();
    }

    update(options: any) {
        this.unbindEvents();
        super.update(options);
        this.bindEvents();
    }

    bindEvents() {
        const { graph } = this.context;
        graph.on(NodeEvent.POINTER_ENTER, this.showIcon);
        graph.on(NodeEvent.POINTER_LEAVE, this.hideIcon);
        graph.on(TreeEvent.COLLAPSE_EXPAND, this.onCollapseExpand);
    }

    unbindEvents() {
        const { graph } = this.context;
        graph.off(NodeEvent.POINTER_ENTER, this.showIcon);
        graph.off(NodeEvent.POINTER_LEAVE, this.hideIcon);
        graph.off(TreeEvent.COLLAPSE_EXPAND, this.onCollapseExpand);
    }

    status = 'idle';
    showIcon = (event: any) => { this.setIcon(event, true); };
    hideIcon = (event: any) => { this.setIcon(event, false); };
    setIcon = (event: any, show: boolean) => {
        if (this.status !== 'idle') return;
        const { target } = event;
        const id = target.id;
        const { graph, element } = this.context;
        graph.updateNodeData([{ id, style: { showIcon: show } }]);
        element.draw({ animation: false, silence: true });
    };

    onCollapseExpand = async (event: any) => {
        this.status = 'busy';
        const { id, collapsed } = event;
        const { graph } = this.context;
        await graph.frontElement(id);
        if (collapsed) await graph.collapseElement(id);
        else await graph.expandElement(id);
        this.status = 'idle';
    };
}

register(ExtensionCategory.NODE, 'mindmap', MindmapNode);
register(ExtensionCategory.EDGE, 'mindmap', MindmapEdge);
register(ExtensionCategory.BEHAVIOR, 'collapse-expand-tree', CollapseExpandTree);

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
                    labelPadding: direction === 'left' ? [2, 0, 10, 40] : [2, 40, 10, 0],
                    ...(isRoot ? RootNodeStyle : NodeStyle),
                };
            },
        },
        edge: {
            type: 'mindmap',
            style: {
                lineWidth: 3,
                stroke: '#99ADD1',
            },
        },
        layout: {
            type: 'mindmap',
            direction: 'H',
            getHeight: () => 30,
            getWidth: (node: any) => getNodeWidth(node.id, node.id === rootId),
            getVGap: () => 6,
            getHGap: () => 60,
            animation: false,
        },
        behaviors: ['drag-canvas', 'zoom-canvas', 'drag-node', 'collapse-expand-tree'],
        autoFit: 'view',
        animation: false,
    });

    await graph.render();
    return graph;
};
