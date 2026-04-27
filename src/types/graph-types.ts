import type {EdgeData, NodeData} from '@antv/g6';

// Refining G6 Node and Edge types with domain-specific properties
export interface G6Node extends NodeData {
    label: string;
    entityType?: 'Ability' | 'Area' | 'Scope';
}

export interface G6Edge extends EdgeData {
    label?: string;
}
