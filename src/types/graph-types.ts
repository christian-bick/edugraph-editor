// Interface for G6 Node and Edge
export interface G6Node {
    id: string;
    label: string;
    style?: any;
    type?: string;
    size?: number | number[];
    color?: string;
    entityType?: 'Ability' | 'Area' | 'Scope';
}

export interface G6Edge {
    id?: string;
    source: string;
    target: string;
    label?: string;
    style?: any;
    type?: string;
    color?: string;
}
