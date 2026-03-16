import { describe, it, expect, beforeEach } from 'vitest';
import { useOntologyStore, useTemporalOntologyStore } from './ontology-store';
import { Ontology, OntologyEntity } from '../types/ontology-types';

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
        // Reset stores before each test
        useOntologyStore.setState({
            ontologies: { Area: null, Ability: null, Scope: null },
            ontologiesOriginal: { Area: null, Ability: null, Scope: null },
            loading: false,
            error: null,
        });
        // Clear history
        useTemporalOntologyStore.temporal.getState().clear();
    });

    it('should update an entity and all its relations', () => {
        // 1. Set initial state
        const initialOntologies = { Area: structuredClone(mockAreaOntology), Ability: null, Scope: null };
        useTemporalOntologyStore.getState().setOntologies(initialOntologies);
        useOntologyStore.setState({ ontologies: initialOntologies });

        const originalEntity = mockAreaOntology.entities[0]; // Entity A
        const newId = 'A_renamed';
        const newDefinition = 'New Def A';

        // 2. Call the update action
        const { updateEntity } = useOntologyStore.getState();
        updateEntity('Area', originalEntity, newId, newDefinition);

        // 3. Assert changes
        const updatedOntologies = useOntologyStore.getState().ontologies;
        const updatedAreaOntology = updatedOntologies.Area;
        const newIri = `http://edugraph.io/edu/${newId}`;

        // Assert entity was updated
        const updatedEntity = updatedAreaOntology?.entities.find(e => e.iri === newIri);
        expect(updatedEntity).toBeDefined();
        expect(updatedEntity?.name).toBe(newId);
        expect(updatedEntity?.definition).toBe(newDefinition);
        expect(updatedAreaOntology?.entities.find(e => e.iri === originalEntity.iri)).toBeUndefined();

        // Assert relations were updated
        expect(updatedAreaOntology?.relations.expands[newIri]).toBeDefined();
        expect(updatedAreaOntology?.relations.expands[originalEntity.iri]).toBeUndefined();
        expect(updatedAreaOntology?.relations.expands[newIri]).toContain('http://edugraph.io/edu/B');
    });

    it('should undo and redo an entity update', () => {
        // 1. Set initial state
        const initialOntologies = { Area: structuredClone(mockAreaOntology), Ability: null, Scope: null };
        useTemporalOntologyStore.getState().setOntologies(initialOntologies);
        useOntologyStore.setState({ ontologies: initialOntologies, ontologiesOriginal: initialOntologies });

        // Clear history after test-specific setup!
        useTemporalOntologyStore.temporal.getState().clear();

        const originalEntity = mockAreaOntology.entities[0];

        // 2. Perform an update
        const { updateEntity } = useOntologyStore.getState();
        updateEntity('Area', originalEntity, 'A_new', 'A new def');

        const temporalStore = useTemporalOntologyStore.temporal.getState();
        expect(temporalStore.pastStates).toHaveLength(1);
        expect(temporalStore.futureStates).toHaveLength(0);

        // 3. Undo the change
        temporalStore.undo();

        const undoneOntology = useOntologyStore.getState().ontologies.Area;
        // Assert state is back to original
        expect(undoneOntology?.entities.find(e => e.name === 'A_new')).toBeUndefined();
        expect(undoneOntology?.entities.find(e => e.name === 'A')).toBeDefined();
        expect(useTemporalOntologyStore.temporal.getState().pastStates).toHaveLength(0);
        expect(useTemporalOntologyStore.temporal.getState().futureStates).toHaveLength(1);

        // 4. Redo the change
        temporalStore.redo();

        const redoneOntology = useOntologyStore.getState().ontologies.Area;
        // Assert state is the updated one again
        expect(redoneOntology?.entities.find(e => e.name === 'A')).toBeUndefined();
        expect(redoneOntology?.entities.find(e => e.name === 'A_new')).toBeDefined();
        expect(useTemporalOntologyStore.temporal.getState().pastStates).toHaveLength(1);
        expect(useTemporalOntologyStore.temporal.getState().futureStates).toHaveLength(0);
    });
});
