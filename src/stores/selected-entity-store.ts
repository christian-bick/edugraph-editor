import { create } from 'zustand';
import {OntologyEntity} from "../types/ontology-types.ts";

export interface SelectedEntity extends OntologyEntity {
    relations: {
        [relationName: string]: OntologyEntity[];
    }
}

interface SelectedEntityState {
    selectedEntity: SelectedEntity | null;
}

interface SelectedEntityAction {
    setSelectedEntity: (entity: SelectedEntity | null) => void;
}

export const useSelectedEntityStore = create<SelectedEntityState & SelectedEntityAction>()((set) => ({
    selectedEntity: null,
    setSelectedEntity: (entity) => set({ selectedEntity: entity }),
}));
