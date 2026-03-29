export interface OntologyEntity {
    iri: string;
    name: string;
    definition: string;
    examples: string;
}

export interface OntologyRelations {
    expands: Record<string, string[]>;
    constrains: Record<string, string[]>;
    inverts: Record<string, string[]>;
    integrates: Record<string, string[]>;
    decomposes: Record<string, string[]>;
    translates: Record<string, string[]>;
    partOf: Record<string, string[]>;
    includes: Record<string, string[]>;
}

export type RelationType = keyof OntologyRelations;

export interface Ontology {
    entities: OntologyEntity[];
    relations: OntologyRelations;
    inferredRelations?: Partial<OntologyRelations>;
    sha: string | null;
}
