import type { OntologyRelations } from "../types/ontology-types";

export type PerspectiveType = 'Progression' | 'Taxonomy' | 'Application' | 'Understanding';

export interface RelationConfig {
    id: keyof OntologyRelations;
    label: string;
    inverseId: string;
    inverseLabel: string;
    perspectives: PerspectiveType[];
}

export const RELATIONS: RelationConfig[] = [
    {
        id: 'expands',
        label: 'Expands',
        inverseId: 'expandedBy',
        inverseLabel: 'Expanded By',
        perspectives: ['Progression', 'Understanding'],
    },
    {
        id: 'constrains',
        label: 'Constrains',
        inverseId: 'constrainedBy',
        inverseLabel: 'Constrained By',
        perspectives: ['Progression', 'Understanding'],
    },
    {
        id: 'inverts',
        label: 'Inverts',
        inverseId: 'invertedBy',
        inverseLabel: 'Inverted By',
        perspectives: ['Progression', 'Understanding'],
    },
    {
        id: 'integrates',
        label: 'Integrates',
        inverseId: 'integratedIn',
        inverseLabel: 'Integrated In',
        perspectives: ['Progression', 'Application'],
    },
    {
        id: 'decomposes',
        label: 'Decomposes',
        inverseId: 'decomposedBy',
        inverseLabel: 'Decomposed By',
        perspectives: ['Progression', 'Application'],
    },
    {
        id: 'translates',
        label: 'Translates',
        inverseId: 'translatedTo',
        inverseLabel: 'Translated To',
        perspectives: ['Progression', 'Application'],
    },
    {
        id: 'partOf',
        label: 'Part Of',
        inverseId: 'hasPart',
        inverseLabel: 'Has Part',
        perspectives: ['Taxonomy'],
    },
    {
        id: 'includes',
        label: 'Includes',
        inverseId: 'includedIn',
        inverseLabel: 'Included In',
        perspectives: ['Taxonomy'],
    }
];

export const getRelationsByPerspective = (perspective: string) =>
    RELATIONS.filter(r => r.perspectives.includes(perspective as PerspectiveType));

export const getRelationById = (id: string) =>
    RELATIONS.find(r => r.id === id);
