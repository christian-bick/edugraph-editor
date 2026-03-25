import type { OntologyRelations } from "../types/ontology-types";

export interface RelationConfig {
    id: keyof OntologyRelations;
    label: string;
    inverseId: string;
    inverseLabel: string;
    perspective: 'Progression' | 'Taxonomy';
}

export const RELATIONS: RelationConfig[] = [
    {
        id: 'expands',
        label: 'Expands',
        inverseId: 'expandedBy',
        inverseLabel: 'Expanded By',
        perspective: 'Progression',
    },
    {
        id: 'constrains',
        label: 'Constrains',
        inverseId: 'constrainedBy',
        inverseLabel: 'Constrained By',
        perspective: 'Progression',
    },
    {
        id: 'inverts',
        label: 'Inverts',
        inverseId: 'inverts',
        inverseLabel: 'Inverts',
        perspective: 'Progression',
    },
    {
        id: 'integrates',
        label: 'Integrates',
        inverseId: 'integratedBy',
        inverseLabel: 'Integrated By',
        perspective: 'Progression',
    },
    {
        id: 'decomposes',
        label: 'Decomposes',
        inverseId: 'decomposedBy',
        inverseLabel: 'Decomposed By',
        perspective: 'Progression',
    },
    {
        id: 'translates',
        label: 'Translates',
        inverseId: 'translates',
        inverseLabel: 'Translates',
        perspective: 'Progression',
    },
    {
        id: 'partOf',
        label: 'Part Of',
        inverseId: 'hasPart',
        inverseLabel: 'Has Part',
        perspective: 'Taxonomy',
    },
    {
        id: 'includes',
        label: 'Includes',
        inverseId: 'includedIn',
        inverseLabel: 'Included In',
        perspective: 'Taxonomy',
    }
];

export const getRelationsByPerspective = (perspective: string) => 
    RELATIONS.filter(r => r.perspective === perspective);

export const getRelationById = (id: string) => 
    RELATIONS.find(r => r.id === id);
