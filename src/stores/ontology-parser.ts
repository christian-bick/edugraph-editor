import { Parser, Quad } from 'n3';
import type {Ontology} from "../types/ontology-types.ts";

// RDF URIs based on core-ontology.ttl
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const RDFS_COMMENT = 'http://www.w3.org/2000/01/rdf-schema#comment';
const RDFS_IS_DEFINED_BY = 'http://www.w3.org/2000/01/rdf-schema#isDefinedBy';

const EDU_BASE = 'http://edugraph.io/edu#';
const EDU_INDIVIDUAL_BASE = 'http://edugraph.io/edu/';
const OWL_NAMED_INDIVIDUAL = 'http://www.w3.org/2002/07/owl#NamedIndividual';

const TYPE_ABILITY = EDU_BASE + 'Ability';
const TYPE_AREA = EDU_BASE + 'Area';
const TYPE_SCOPE = EDU_BASE + 'Scope';

const PREDICATE_EXPANDS = EDU_BASE + 'expands';
const PREDICATE_PARTOF = EDU_BASE + 'partOf';
const PREDICATE_INCLUDES = EDU_BASE + 'includes';

export interface EntityTempInfo {
    type: 'Ability' | 'Area' | 'Scope';
    name: string;
    natural_name: string;
    iri: string;
    definition: string;
    examples: string;
}

const toNaturalName = (name: string): string => {
    return name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Za-z])([0-9])/g, '$1 $2');
};

export const getQuadsFromString = async (turtleString: string): Promise<Quad[]> => {
    const parser = new Parser();
    const quads: Quad[] = [];
    return new Promise((resolve, reject) => {
        parser.parse(turtleString, (error, quad) => {
            if (error) {
                return reject(error);
            }
            if (quad) {
                quads.push(quad);
            } else {
                resolve(quads);
            }
        });
    });
};

export const createEntityInfoMap = (quads: Quad[]): Map<string, EntityTempInfo> => {
    const entityInfoMap = new Map<string, EntityTempInfo>();

    quads.forEach(quad => {
        if (quad.predicate.value === RDF_TYPE && quad.object.value === OWL_NAMED_INDIVIDUAL) {
            const subjectIRI = quad.subject.value;
            if (!entityInfoMap.has(subjectIRI)) {
                const name = subjectIRI.replace(EDU_INDIVIDUAL_BASE, '');
                entityInfoMap.set(subjectIRI, {
                    type: 'Ability', // Default, will be updated
                    name,
                    natural_name: toNaturalName(name),
                    iri: subjectIRI,
                    definition: '',
                    examples: ''
                });
            }
        }
    });
    return entityInfoMap;
};

export const populateOntologyFromQuads = (
    ontology: Ontology,
    quads: Quad[],
    entityInfoMap: Map<string, EntityTempInfo>
) => {
    // Second pass: Populate types, natural names, and relations
    quads.forEach(quad => {
        const subjectIRI = quad.subject.value;
        const predicateIRI = quad.predicate.value;
        const objectValue = quad.object.value;

        if (entityInfoMap.has(subjectIRI)) {
            const entity = entityInfoMap.get(subjectIRI)!;

            // Refine entity type
            if (predicateIRI === RDF_TYPE && (objectValue === TYPE_ABILITY || objectValue === TYPE_AREA || objectValue === TYPE_SCOPE)) {
                if (objectValue === TYPE_ABILITY) entity.type = 'Ability';
                else if (objectValue === TYPE_AREA) entity.type = 'Area';
                else if (objectValue === TYPE_SCOPE) entity.type = 'Scope';
            } else if (predicateIRI === RDFS_COMMENT && quad.object.termType === 'Literal') {
                entity.examples = objectValue;
            } else if (predicateIRI === RDFS_IS_DEFINED_BY && quad.object.termType === 'Literal') {
                entity.definition = objectValue;
            }
        }

        // Populate relations (subject and object must be NamedNodes)
        if (quad.subject.termType === 'NamedNode' && quad.object.termType === 'NamedNode') {
            const subjectName = quad.subject.value;
            const objectName = quad.object.value;

            if (predicateIRI === PREDICATE_EXPANDS) {
                if (!ontology.relations.expands[subjectName]) {
                    ontology.relations.expands[subjectName] = [];
                }
                ontology.relations.expands[subjectName].push(objectName);
            } else if (predicateIRI === PREDICATE_PARTOF) {
                if (!ontology.relations.partOf[subjectName]) {
                    ontology.relations.partOf[subjectName] = [];
                }
                ontology.relations.partOf[subjectName].push(objectName);
            } else if (predicateIRI === PREDICATE_INCLUDES) {
                if (!ontology.relations.includes[subjectName]) {
                    ontology.relations.includes[subjectName] = [];
                }
                ontology.relations.includes[subjectName].push(objectName);
            }
        }
    });

    // Finally, add all collected entities to the newOntology.entities structure
    entityInfoMap.forEach(info => {
        // Avoid duplicates
        if (!ontology.entities.some(e => e.iri === info.iri)) {
            ontology.entities.push({
                iri: info.iri,
                name: info.name,
                natural_name: info.natural_name,
                definition: info.definition,
                examples: info.examples,
            });
        }
    });
};


export const enrichOntology = (ontology: Ontology): Ontology => {
    if (!ontology || !ontology.relations) return ontology;

    const transitiveIncludes = computeTransitiveClosure(ontology.relations.includes || {});

    return {
        ...ontology,
        relations: {
            ...ontology.relations,
            includes: transitiveIncludes,
        }
    };
};

const computeTransitiveClosure = (source: Record<string, string[]>) => {
    const closure: Record<string, Set<string>> = {};

    // Initialize with direct relations
    Object.keys(source).forEach(key => {
        closure[key] = new Set(source[key]);
    });

    let changed = true;
    while (changed) {
        changed = false;
        // Create a snapshot of keys to iterate to allow reading updated sets effectively
        // (though finding fixed point doesn't strictly need snapshot if we just iterate enough)
        const keys = Object.keys(closure);
        for (const key of keys) {
            const currentSet = closure[key];
            const originalSize = currentSet.size;

            for (const neighbor of Array.from(currentSet)) {
                if (closure[neighbor]) {
                    for (const n of Array.from(closure[neighbor])) {
                        currentSet.add(n);
                    }
                }
            }

            if (currentSet.size > originalSize) {
                changed = true;
            }
        }
    }

    // Convert back to arrays
    const result: Record<string, string[]> = {};
    Object.keys(closure).forEach(key => {
        result[key] = Array.from(closure[key]);
    });
    return result;
};
