import {create} from 'zustand';
import type {OntologyEntity} from "../types/ontology-types.ts";

export interface SelectedEntity extends OntologyEntity {
    relations: {
        [relationName: string]: OntologyEntity[];
    }
}

interface SelectedEntityState {
    selectedEntityIri: string | null;
}

interface SelectedEntityAction {
    setSelectedEntityIri: (iri: string | null) => void;
}

export const useSelectedEntityStore = create<SelectedEntityState & SelectedEntityAction>()((set) => ({
    selectedEntityIri: null,
    setSelectedEntityIri: (iri) => set({ selectedEntityIri: iri }),
}));
