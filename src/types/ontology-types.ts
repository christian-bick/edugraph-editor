export interface OntologyEntity {
    iri: string;
    name: string;
    definition: string;
    examples: string;
}

export interface OntologyRelations {
    expands: Record<string, string[]>;
    partOf: Record<string, string[]>;
    includes: Record<string, string[]>;
}

export interface Ontology {
    entities: OntologyEntity[];
    relations: OntologyRelations;
}

