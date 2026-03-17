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

    it('should update only the IRI and relations, not the definition', () => {
        const initialOntology = structuredClone(mockAreaOntology);
        useCurrentOntologyStore.setState({ ontologies: { Area: initialOntology, Ability: null, Scope: null } });
        useCurrentOntologyStore.temporal.getState().clear();

        const originalEntity = initialOntology.entities[0]; // Entity A
        const originalDefinition = originalEntity.definition;
        const newId = 'A_renamed';

        useCurrentOntologyStore.getState().updateIri('Area', originalEntity, newId);

        const updatedOntology = useCurrentOntologyStore.getState().ontologies.Area;
        const newIri = `${IRI_NAMESPACE}${newId}`;

        // Assert entity A itself is updated
        const updatedEntity = updatedOntology?.entities.find(e => e.iri === newIri);
        expect(updatedEntity).toBeDefined();
        expect(updatedEntity?.name).toBe(newId);
        expect(updatedEntity?.definition).toBe(originalDefinition); // Definition should NOT have changed
        expect(updatedOntology?.entities.find(e => e.iri === originalEntity.iri)).toBeUndefined();

        // Assert relation where A is a subject is updated
        expect(updatedOntology?.relations.expands[newIri]).toBeDefined();
        expect(updatedOntology?.relations.expands[originalEntity.iri]).toBeUndefined();
        expect(updatedOntology?.relations.expands[newIri]).toContain('http://edugraph.io/edu/B');

        // Assert relation where A is an object is updated
        expect(updatedOntology?.relations.expands['http://edugraph.io/edu/C']).toContain(newIri);
        expect(updatedOntology?.relations.expands['http://edugraph.io/edu/C']).not.toContain(originalEntity.iri);

        expect(useCurrentOntologyStore.temporal.getState().pastStates).toHaveLength(1);
    });

    it('should update only the definition', () => {
        const initialOntology = structuredClone(mockAreaOntology);
        useCurrentOntologyStore.setState({ ontologies: { Area: initialOntology, Ability: null, Scope: null } });
        useCurrentOntologyStore.temporal.getState().clear();

        const originalEntity = initialOntology.entities[1]; // Entity B
        const oldIri = originalEntity.iri;
        const originalName = originalEntity.name;
        const newDefinition = 'A much better definition for B';

        useCurrentOntologyStore.getState().updateDefinition('Area', originalEntity, newDefinition);

        const updatedOntology = useCurrentOntologyStore.getState().ontologies.Area;
        const updatedEntity = updatedOntology?.entities.find(e => e.iri === oldIri);

        // Assert entity B's definition is updated
        expect(updatedEntity).toBeDefined();
        expect(updatedEntity?.definition).toBe(newDefinition);

        // Assert other properties are unchanged
        expect(updatedEntity?.iri).toBe(oldIri);
        expect(updatedEntity?.name).toBe(originalName);

        // Assert that relations are identical
        expect(updatedOntology?.relations).toEqual(initialOntology.relations);

        expect(useCurrentOntologyStore.temporal.getState().pastStates).toHaveLength(1);
    });
});
