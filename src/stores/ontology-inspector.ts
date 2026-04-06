import { Ontology, OntologyEntity } from "../types/ontology-types";
import { invertRelations } from "./utils";

export type IssueType = 'missing_definition' | 'orphan_structural';

export interface OntologyIssue {
    type: IssueType;
    entity: OntologyEntity;
    description: string;
}

export const findOntologyIssues = (ontology: Ontology | null): OntologyIssue[] => {
    if (!ontology) return [];

    const issues: OntologyIssue[] = [];
    const hasPart = invertRelations(ontology.relations.partOf || {});

    ontology.entities.forEach(entity => {
        // 1. Missing Definition
        if (!entity.definition || entity.definition.trim() === '') {
            issues.push({
                type: 'missing_definition',
                entity,
                description: 'Entity has no definition.'
            });
        }

        // 2. Orphan Structural (no partOf and no hasPart)
        const parents = ontology.relations.partOf?.[entity.iri] || [];
        const children = hasPart[entity.iri] || [];

        if (parents.length === 0 && children.length === 0) {
            issues.push({
                type: 'orphan_structural',
                entity,
                description: 'Entity is not connected via partOf or hasPart relations.'
            });
        }
    });

    return issues;
};
