import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    getQuadsFromString,
    createEntityInfoMap,
    populateOntologyFromQuads,
} from './ontology-parser';
import { serializeOntology } from './ontology-serializer';
import type { Ontology } from '../types/ontology-types';

describe('Ontology Serializer', () => {
    it('should perform a parser-serializer roundtrip without data loss', async () => {
        // 1. Load and parse the original TTL file content
        const ttlPath = path.resolve(process.cwd(), 'examples/ontology/core-areas-math.ttl');
        const originalTtlContent = fs.readFileSync(ttlPath, 'utf-8');

        const originalQuads = await getQuadsFromString(originalTtlContent);
        const originalEntityInfoMap = createEntityInfoMap(originalQuads);
        const ontologyA: Ontology = {
            entities: [],
            relations: { expands: {}, partOf: {}, includes: {} },
        };
        populateOntologyFromQuads(ontologyA, originalQuads, originalEntityInfoMap);

        // 2. Serialize the parsed object back into a TTL string
        const serializedTtlContent = await serializeOntology(ontologyA, 'Area');

        // 3. Parse the serialized TTL string back into a new object
        const serializedQuads = await getQuadsFromString(serializedTtlContent);
        const serializedEntityInfoMap = createEntityInfoMap(serializedQuads);
        const ontologyB: Ontology = {
            entities: [],
            relations: { expands: {}, partOf: {}, includes: {} },
        };
        populateOntologyFromQuads(ontologyB, serializedQuads, serializedEntityInfoMap);

        // 4. Sort entities in both objects to ensure order doesn't fail the deep equality check
        ontologyA.entities.sort((a, b) => a.iri.localeCompare(b.iri));
        ontologyB.entities.sort((a, b) => a.iri.localeCompare(b.iri));

        // 5. Assert that the two data structures are deeply equal
        expect(ontologyB).toEqual(ontologyA);
    });
});
