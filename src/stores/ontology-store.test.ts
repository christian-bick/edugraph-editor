import { describe, it, expect, beforeEach } from 'vitest';
import { useOntologyStore } from './ontology-store';
import { Ontology } from '../types/ontology-types';

const mockAreaOntology: Ontology = {
    entities: [
        { iri: 'http://edugraph.io/edu/A', name: 'A', definition: 'Def A', examples: '' },
        { iri: 'http://edugraph.io/edu/B', name: 'B', definition: 'Def B', examples: '' },
        { iri: 'http://edugraph.io/edu/C', name: 'C', definition: 'Def C', examples: '' },
    ],
    relations: {
        expands: { 'http://edugraph.io/edu/A': ['http://edugraph.io/edu/B'] },
        partOf: { 'http://edugraph.io/edu/B': ['http://edugraph.io/edu/C'] },
        includes: {},
    },
};

describe('Ontology Store', () => {

    beforeEach(() => {
        // Reset the store to its initial state
        useOntologyStore.setState({
            ontologies: { Area: null, Ability: null, Scope: null },
            ontologiesOriginal: { Area: null, Ability: null, Scope: null },
            loading: false,
            error: null,
        });
        // This is important: we need to clear the temporal history between tests
        useOntologyStore.temporal.getState().clear();
    });

    it('should update an entity and all its relations', () => {
        const initialOntology = structuredClone(mockAreaOntology);
        useOntologyStore.setState({ ontologies: { Area: initialOntology, Ability: null, Scope: null } });

        const originalEntity = initialOntology.entities[0];
        const newId = 'A_renamed';
        const newDefinition = 'New Def A';

        useOntologyStore.getState().updateEntity('Area', originalEntity, newId, newDefinition);

        const updatedOntology = useOntologyStore.getState().ontologies.Area;
        const newIri = `http://edugraph.io/edu/${newId}`;

        const updatedEntity = updatedOntology?.entities.find(e => e.iri === newIri);
        expect(updatedEntity).toBeDefined();
        expect(updatedEntity?.name).toBe(newId);
        expect(updatedEntity?.definition).toBe(newDefinition);
        expect(updatedOntology?.entities.find(e => e.iri === originalEntity.iri)).toBeUndefined();

        expect(updatedOntology?.relations.expands[newIri]).toBeDefined();
        expect(updatedOntology?.relations.expands[originalEntity.iri]).toBeUndefined();
        expect(updatedOntology?.relations.expands[newIri]).toContain('http://edugraph.io/edu/B');

        // The initial setState and the updateEntity call should be in the history
        expect((useOntologyStore.temporal.getState().pastStates)).toHaveLength(2);
    });
});
