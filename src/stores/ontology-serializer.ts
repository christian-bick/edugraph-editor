import type { Ontology, OntologyEntity, OntologyRelations } from "../types/ontology-types.ts";
import { Writer, DataFactory } from "n3";

const { namedNode, literal, quad } = DataFactory;

const BASE_IRI = 'http://edugraph.io/edu/';

const PREFIXES = {
    '': BASE_IRI,
    edu: 'http://edugraph.io/edu#',
    owl: 'http://www.w3.org/2002/07/owl#',
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    xml: 'http://www.w3.org/XML/1998/namespace',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
};

export const serializeOntology = async (ontology: Ontology, dimension: 'Area' | 'Ability' | 'Scope'): Promise<string> => {
    console.log("Ontology received for serialization:", ontology);
    const writer = new Writer({ prefixes: PREFIXES, base: BASE_IRI });

    // Add ontology declaration as a quad (equivalent to the old header part)
    writer.addQuad(
        namedNode(BASE_IRI),
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode('http://www.w3.org/2002/07/owl#Ontology')
    );
    writer.addQuad(
        namedNode(BASE_IRI),
        namedNode('http://www.w3.org/2002/07/owl#imports'),
        namedNode('http://edugraph.io/edu#')
    );

    // Sort entities to ensure consistent serialization order
    const sortedEntities = [...ontology.entities].sort((a, b) => a.iri.localeCompare(b.iri));

    sortedEntities.forEach(entity => {
        const entityNode = namedNode(entity.iri);

        // Add rdf:type owl:NamedIndividual
        writer.addQuad(
            entityNode,
            namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            namedNode('http://www.w3.org/2002/07/owl#NamedIndividual')
        );

        // Add edu:Dimension type
        writer.addQuad(
            entityNode,
            namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
            namedNode(`http://edugraph.io/edu#${dimension}`)
        );

        // Add rdfs:comment (examples)
        if (entity.examples) {
            writer.addQuad(
                entityNode,
                namedNode('http://www.w3.org/2000/01/rdf-schema#comment'),
                literal(entity.examples)
            );
        }

        // Add rdfs:isDefinedBy (definition)
        if (entity.definition) {
            writer.addQuad(
                entityNode,
                namedNode('http://www.w3.org/2000/01/rdf-schema#isDefinedBy'),
                literal(entity.definition)
            );
        }
    });

    // Add relations
    const relationKeys = Object.keys(ontology.relations) as Array<keyof OntologyRelations>;
    relationKeys.sort(); // Sort relation types for consistent output

    relationKeys.forEach(relationType => {
        const subjects = ontology.relations[relationType];
        if (subjects) {
            Object.keys(subjects).sort().forEach(subjectIri => { // Sort subject IRIs
                const objectIris = subjects[subjectIri];
                if (objectIris) {
                    [...objectIris].sort().forEach(objectIri => { // Sort object IRIs without mutating original
                        writer.addQuad(
                            namedNode(subjectIri),
                            namedNode(`http://edugraph.io/edu#${relationType}`),
                            namedNode(objectIri)
                        );
                    });
                }
            });
        }
    });

    return new Promise<string>((resolve, reject) => {
        writer.end((error, result) => {
            if (error) {
                return reject(error);
            }
            // Normalize the output to match GitHub's standard for TTL files
            resolve(normalizeToGithubStandard(result || ''));
        });
    });
};

export const normalizeToGithubStandard = (content: string): string => {
    // 1. Remove BOM if present (fs.readFileSync with 'utf-8' often strips it)
    const BOM = '\uFEFF';
    let normalized = content.startsWith(BOM) ? content.substring(BOM.length) : content;

    // 2. Force Unix Line Endings (LF)
    normalized = normalized.replace(/\r\n/g, '\n');

    // 3. Ensure a single trailing newline (GitHub standard)
    normalized = normalized.trimEnd() + '\n';

    return normalized;
};
