import { create } from 'zustand';
import {Ontology, OntologyEntity} from "../types/ontology-types.ts";
import {invertRelations} from "./utils.ts";

export interface SelectedEntity extends OntologyEntity {
    relations: {
        [relationName: string]: OntologyEntity[];
    }
}

interface SelectedEntityState {
    selectedEntity: SelectedEntity | null;
}

interface SelectedEntityAction {
    setSelectedEntity: (entity: OntologyEntity | null, ontology: Ontology | null) => void;
}

export const useSelectedEntityStore = create<SelectedEntityState & SelectedEntityAction>()((set) => ({
    selectedEntity: null,
    setSelectedEntity: (entity, ontology) => {
        if (!entity || !ontology) {
            set({ selectedEntity: null });
            return;
        }

        const allEntities = ontology.entities;
        const directRelations: { [relationName: string]: OntologyEntity[] } = {};
        for (const rel in ontology.relations) {
            const relTyped = rel as keyof typeof ontology.relations;
            if (ontology.relations[relTyped]?.[entity.iri]) {
                const relatedIris = ontology.relations[relTyped]![entity.iri];
                directRelations[relTyped] = relatedIris.map(iri => allEntities.find(e => e.iri === iri)!).filter(Boolean) as OntologyEntity[];
            }
        }

        const inverseRelations = {
            expandedBy: invertRelations(ontology.relations.expands),
            hasPart: invertRelations(ontology.relations.partOf),
            includedBy: invertRelations(ontology.relations.includes),
        };

        const allRelations = { ...directRelations };
        for (const rel in inverseRelations) {
            const relTyped = rel as keyof typeof inverseRelations;
            if (inverseRelations[relTyped]?.[entity.iri]) {
                const relatedIris = inverseRelations[relTyped]![entity.iri];
                allRelations[relTyped] = relatedIris.map(iri => allEntities.find(e => e.iri === iri)!).filter(Boolean) as OntologyEntity[];
            }
        }

        set({
            selectedEntity: {
                ...entity,
                relations: allRelations,
            }
        });
    },
}));
