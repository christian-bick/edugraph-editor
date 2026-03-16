import { describe, it, expect, beforeEach } from 'vitest';
import { useOntologyStore, useCurrentOntologyStore } from './ontology-store';
import { Ontology } from '../types/ontology-types';

const IRI_NAMESPACE = 'http://edugraph.io/edu/';

const mockAreaOntology: Ontology = {
    entities: [
        { iri: 'http://edugraph.io/edu/A', name: 'A', definition: 'Def A', examples: '' },
        { iri: 'http://edugraph.io/edu/B', name: 'B', definition: 'Def B', examples: '' },
        { iri: 'http://edugraph.io/edu/C', name: 'C', definition: 'Def C', examples: '' },
    ],
    relations: {
        expands: {
            'http://edugraph.io/edu/A': ['http://edugraph.io/edu/B'],
            'http://edugraph.io/edu/C': ['http://edugraph.io/edu/A'] // C expands A
        },
        partOf: { 'http://edugraph.io/edu/B': ['http://edugraph.io/edu/C'] },
        includes: {},
    },
};

describe('Ontology Store', () => {

    beforeEach(() => {
        // Reset both stores to their initial states
        useOntologyStore.setState({
            ontologiesOriginal: { Area: null, Ability: null, Scope: null },
            loading: false,
            error: null,
        });
        useCurrentOntologyStore.setState({
            ontologies: { Area: null, Ability: null, Scope: null },
        });
        // Clear the temporal history for the current ontology store
        useCurrentOntologyStore.temporal.getState().clear();
    });

    it('should update an entity and all its relations', () => {
        const initialOntology = structuredClone(mockAreaOntology);
        useCurrentOntologyStore.setState({ ontologies: { Area: initialOntology, Ability: null, Scope: null } });
        // Clear history after setting initial test state
        useCurrentOntologyStore.temporal.getState().clear();

        const originalEntity = initialOntology.entities[0]; // Entity A
        const newId = 'A_renamed';
        const newDefinition = 'New Def A';

        // Call the action on the correct store
        useCurrentOntologyStore.getState().updateEntity('Area', originalEntity, newId, newDefinition);

        const updatedOntology = useCurrentOntologyStore.getState().ontologies.Area;
        const newIri = `http://edugraph.io/edu/${newId}`;

        // Assert entity A itself is updated
        const updatedEntity = updatedOntology?.entities.find(e => e.iri === newIri);
        expect(updatedEntity).toBeDefined();
        expect(updatedEntity?.name).toBe(newId);
        expect(updatedEntity?.definition).toBe(newDefinition);
        expect(updatedOntology?.entities.find(e => e.iri === originalEntity.iri)).toBeUndefined();

        // Assert relation where A is a subject is updated
        expect(updatedOntology?.relations.expands[newIri]).toBeDefined();
        expect(updatedOntology?.relations.expands[originalEntity.iri]).toBeUndefined();
        expect(updatedOntology?.relations.expands[newIri]).toContain('http://edugraph.io/edu/B');

        // Assert relation where A is an object is updated
        expect(updatedOntology?.relations.expands['http://edugraph.io/edu/C']).toBeDefined();
        expect(updatedOntology?.relations.expands['http://edugraph.io/edu/C']).toContain(newIri);
        expect(updatedOntology?.relations.expands['http://edugraph.io/edu/C']).not.toContain(originalEntity.iri);


        // Only the updateEntity call should be in the history
        expect(useCurrentOntologyStore.temporal.getState().pastStates).toHaveLength(1);
    });

    it('should update only the definition and keep relations unaffected', () => {
        const initialOntology = structuredClone(mockAreaOntology);
        useCurrentOntologyStore.setState({ ontologies: { Area: initialOntology, Ability: null, Scope: null } });
        useCurrentOntologyStore.temporal.getState().clear();

        const originalEntity = initialOntology.entities[1]; // Entity B
        const oldIri = originalEntity.iri;
        const newId = originalEntity.name; // Keep the same ID/name
        const newDefinition = 'Updated Def B Only';

        // Call the action
        useCurrentOntologyStore.getState().updateEntity('Area', originalEntity, newId, newDefinition);

        const updatedOntology = useCurrentOntologyStore.getState().ontologies.Area;

        // Assert entity B itself is updated only in definition
        const updatedEntity = updatedOntology?.entities.find(e => e.iri === oldIri); // Still find by oldIri
        expect(updatedEntity).toBeDefined();
        expect(updatedEntity?.name).toBe(newId); // Name should be the same
        expect(updatedEntity?.definition).toBe(newDefinition); // Definition should be new
        expect(updatedEntity?.iri).toBe(oldIri); // IRI should be the same

        // Assert that relations are identical
        expect(updatedOntology?.relations.expands).toEqual(initialOntology.relations.expands);
        expect(updatedOntology?.relations.partOf).toEqual(initialOntology.relations.partOf);
        expect(updatedOntology?.relations.includes).toEqual(initialOntology.relations.includes);

        // History check
        expect(useCurrentOntologyStore.temporal.getState().pastStates).toHaveLength(1);
    });
});
