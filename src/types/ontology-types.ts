export interface OntologyEntity {
    iri: string;
    name: string;
    natural_name: string;
}

export interface OntologyEntities {
    Ability: OntologyEntity[];
    Area: OntologyEntity[];
    Scope: OntologyEntity[];
}

export interface OntologyRelations {
    expands: Record<string, string[]>;
    partOf: Record<string, string[]>;
    implies: Record<string, string[]>;
    expandedBy?: Record<string, string[]>;
    hasPart?: Record<string, string[]>;
    impliedBy?: Record<string, string[]>;
}

export interface Ontology {
    entities: OntologyEntities;
    relations: OntologyRelations;
}
