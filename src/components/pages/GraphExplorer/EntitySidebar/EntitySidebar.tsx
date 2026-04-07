import React, {useMemo, useState} from 'react';
import {useSelectedEntityStore} from '../../../../stores/selected-entity-store';
import {useBranchStore} from '../../../../stores/branch-store.ts';
import './EntitySidebar.scss';
import EditIcon from '../../../../assets/icons/edit.svg';
import PlusIcon from '../../../../assets/icons/plus.svg';
import GraphParentIcon from '../../../../assets/icons/graph_parent.svg';
import {EditDefinition, EditIri} from '../EditEntity/EditEntity.tsx';
import {calculateInferredRelations, invertRelations, toNaturalName, InferredRelationsMap, InferredRelation} from '../../../../stores/utils.ts';
import {useCurrentOntologyStore} from "../../../../stores/ontology-store.ts";
import type {OntologyEntity, RelationType} from "../../../../types/ontology-types.ts";
import {ModifyRelationModal} from '../ModifyRelation/ModifyRelation.tsx';
import {CreateEntity} from '../CreateEntity/CreateEntity.tsx';
import {EntitySearch} from '../EntitySearch/EntitySearch.tsx';
import {RELATIONS} from '../../../../config/relations.ts';
import clsx from 'clsx';

interface RelationEntity extends OntologyEntity {
    isInferred?: boolean;
    inferredFromIri?: string;
}

interface RelationSectionProps {
    title: string;
    entities: RelationEntity[] | undefined;
    isInverse?: boolean;
    minRelations?: number;
    relationName?: RelationType;
    setSelectedEntityIri: (iri: string | null) => void;
    allEntities: OntologyEntity[];
}

const RelationSection: React.FC<RelationSectionProps> = ({
                                                             title,
                                                             entities,
                                                             isInverse = false,
                                                             minRelations = 0,
                                                             relationName,
                                                             setSelectedEntityIri,
                                                             allEntities
                                                         }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const isEmpty = !entities || entities.length === 0;

    if (isInverse && isEmpty) {
        return null;
    }

    const handleInferredClick = (e: React.MouseEvent, sourceIri: string) => {
        e.stopPropagation();
        setSelectedEntityIri(sourceIri);
    };

    return (
        <div className={clsx("sidebar-section", {"is-empty": isEmpty})}>
            <div className="sidebar-header">
                <h3>{title}</h3>
                {!isInverse && (
                    <button className="edit-btn" onClick={() => setIsAddModalOpen(true)}>
                        <img src={isEmpty ? PlusIcon : EditIcon} alt={isEmpty ? "Add Relation" : "Edit Relations"}/>
                    </button>
                )}
            </div>
            {!isEmpty && (
                <ul>
                    {entities.map(e => {
                        const sourceEntity = e.inferredFromIri ? allEntities.find(ent => ent.iri === e.inferredFromIri) : null;
                        const tooltip = sourceEntity ? `Inferred from: ${toNaturalName(sourceEntity.name)}` : "Inferred Relation";

                        return (
                            <li key={e.iri} onClick={() => setSelectedEntityIri(e.iri)} className={clsx({"is-inferred": e.isInferred})}>
                                <span>{toNaturalName(e.name)}</span>
                                {e.isInferred && (
                                    <img 
                                        src={GraphParentIcon} 
                                        className="inferred-hint" 
                                        title={tooltip} 
                                        alt="Inferred" 
                                        onClick={(event) => e.inferredFromIri && handleInferredClick(event, e.inferredFromIri)}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
            {relationName && <ModifyRelationModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                relationTitle={title}
                relationName={relationName}
                existingRelations={entities || []}
                minRelations={minRelations}
            />}
        </div>
    );
};

/**
 * Computes all relations for an entity, including inferred ones.
 */
const computeEntityRelations = (
    entityIri: string,
    ontology: any
): { [key: string]: RelationEntity[] } => {
    const allEntities = ontology.entities;
    const relationsMap: { [key: string]: RelationEntity[] } = {};
    const inferredMap: InferredRelationsMap = calculateInferredRelations(ontology);

    // 1. Process direct relations (original)
    for (const relType in ontology.relations) {
        if (ontology.relations[relType]?.[entityIri]) {
            const iris = ontology.relations[relType][entityIri];
            if (!relationsMap[relType]) relationsMap[relType] = [];

            iris.forEach((iri: string) => {
                const ent = allEntities.find((e: any) => e.iri === iri);
                if (ent && !relationsMap[relType].some(r => r.iri === ent.iri)) {
                    relationsMap[relType].push({ ...ent, isInferred: false });
                }
            });
        }
    }

    // 2. Process direct relations (inferred)
    for (const relType in inferredMap) {
        if (inferredMap[relType]?.[entityIri]) {
            const infRels = inferredMap[relType][entityIri];
            if (!relationsMap[relType]) relationsMap[relType] = [];

            infRels.forEach(inf => {
                const ent = allEntities.find((e: any) => e.iri === inf.targetIri);
                if (ent && !relationsMap[relType].some(r => r.iri === ent.iri)) {
                    relationsMap[relType].push({ ...ent, isInferred: true, inferredFromIri: inf.sourceIri });
                }
            });
        }
    }

    // 3. Process inverse relations
    RELATIONS.forEach(rel => {
        // Inverse Original
        const invertedOrig = invertRelations(ontology.relations[rel.id] || {});
        if (invertedOrig[entityIri]) {
            if (!relationsMap[rel.inverseId]) relationsMap[rel.inverseId] = [];
            invertedOrig[entityIri].forEach(iri => {
                const ent = allEntities.find((e: any) => e.iri === iri);
                if (ent && !relationsMap[rel.inverseId].some(r => r.iri === ent.iri)) {
                    relationsMap[rel.inverseId].push({ ...ent, isInferred: false });
                }
            });
        }

        // Inverse Inferred
        // Need to invert the inferred mapping too
        const invertedInf: Record<string, InferredRelation[]> = {};
        const relInfMap = inferredMap[rel.id] || {};
        for (const [subj, targets] of Object.entries(relInfMap)) {
            targets.forEach(t => {
                if (!invertedInf[t.targetIri]) invertedInf[t.targetIri] = [];
                invertedInf[t.targetIri].push({ targetIri: subj, sourceIri: t.sourceIri });
            });
        }

        if (invertedInf[entityIri]) {
            if (!relationsMap[rel.inverseId]) relationsMap[rel.inverseId] = [];
            invertedInf[entityIri].forEach(inf => {
                const ent = allEntities.find((e: any) => e.iri === inf.targetIri);
                if (ent && !relationsMap[rel.inverseId].some(r => r.iri === ent.iri)) {
                    relationsMap[rel.inverseId].push({ ...ent, isInferred: true, inferredFromIri: inf.sourceIri });
                }
            });
        }
    });

    return relationsMap;
};

export const EntitySidebar: React.FC = () => {
    const {selectedEntityIri, setSelectedEntityIri} = useSelectedEntityStore();
    const {ontologies, deleteEntity} = useCurrentOntologyStore();
    const {activeDimension} = useBranchStore();
    const [isEditIriOpen, setIsEditIriOpen] = useState(false);
    const [isEditDefinitionOpen, setIsEditDefinitionOpen] = useState(false);
    const [isCreateEntityOpen, setIsCreateEntityOpen] = useState(false);

    const ontology = useMemo(() => ontologies[activeDimension as keyof typeof ontologies], [ontologies, activeDimension]);

    const selectedEntity = useMemo(() => {
        if (!selectedEntityIri || !ontology) return null;

        const entity = ontology.entities.find(e => e.iri === selectedEntityIri);
        if (!entity) return null;

        const relations = computeEntityRelations(selectedEntityIri, ontology);

        return {
            ...entity,
            relations,
        };
    }, [selectedEntityIri, ontology]);

    const hasChildren = useMemo(() => {
        if (!selectedEntity?.relations.hasPart) return false;
        return selectedEntity.relations.hasPart.length > 0;
    }, [selectedEntity]);

    const handleDelete = () => {
        if (selectedEntityIri && !hasChildren) {
            deleteEntity(activeDimension, selectedEntityIri);
            setSelectedEntityIri(null);
        }
    }

    return (
        <>
            <aside className="graph-explorer-sidebar">
                <div className="sidebar-header-search">
                    <EntitySearch showLabel={false} />
                </div>
                {selectedEntity ? (
                    <>
                        <div className="sidebar-title-section">
                            <h2>{toNaturalName(selectedEntity.name)}</h2>
                        </div>

                        <div className="sidebar-content">
                            <div className="sidebar-section">
                                <div className="sidebar-header">
                                    <h3>IRI</h3>
                                    <button className="edit-btn" onClick={() => setIsEditIriOpen(true)}>
                                        <img src={EditIcon} alt="Edit IRI"/>
                                    </button>
                                </div>
                                <div className="section-content-wrapper">
                                    <div className="iri-display">
                                        <span className="iri-id">:{selectedEntity.name}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="sidebar-section">
                                <div className="sidebar-header">
                                    <h3>Definition</h3>
                                    <button className="edit-btn" onClick={() => setIsEditDefinitionOpen(true)}>
                                        <img src={EditIcon} alt="Edit Definition"/>
                                    </button>
                                </div>
                                <div className="section-content-wrapper">
                                    <p>{selectedEntity.definition}</p>
                                </div>
                            </div>

                            <div className="relations-group">
                                {RELATIONS
                                    .sort((a, b) => {
                                        const aEmpty = !selectedEntity.relations[a.id] || selectedEntity.relations[a.id].length === 0;
                                        const bEmpty = !selectedEntity.relations[b.id] || selectedEntity.relations[b.id].length === 0;
                                        if (aEmpty && !bEmpty) return 1;
                                        if (!aEmpty && bEmpty) return -1;
                                        return 0;
                                    })
                                    .map(rel => (
                                        <RelationSection
                                            key={rel.id}
                                            title={rel.label}
                                            relationName={rel.id}
                                            entities={selectedEntity.relations[rel.id]}
                                            minRelations={rel.id === 'partOf' ? 1 : 0}
                                            setSelectedEntityIri={setSelectedEntityIri}
                                            allEntities={ontology?.entities || []}
                                        />
                                    ))}
                            </div>

                            <div className="relations-group inverse">
                                {RELATIONS
                                    .sort((a, b) => {
                                        const aEmpty = !selectedEntity.relations[a.inverseId] || selectedEntity.relations[a.inverseId].length === 0;
                                        const bEmpty = !selectedEntity.relations[b.inverseId] || selectedEntity.relations[b.inverseId].length === 0;
                                        if (aEmpty && !bEmpty) return 1;
                                        if (!aEmpty && bEmpty) return -1;
                                        return 0;
                                    })
                                    .map(rel => (
                                        <RelationSection
                                            key={`${rel.id}-inverse`}
                                            title={rel.inverseLabel}
                                            entities={selectedEntity.relations[rel.inverseId]}
                                            isInverse
                                            setSelectedEntityIri={setSelectedEntityIri}
                                            allEntities={ontology?.entities || []}
                                        />
                                    ))
                                }
                            </div>
                        </div>
                        <div className="sidebar-footer">
                            <div className="footer-buttons">
                                <button className="delete-btn" onClick={handleDelete} disabled={hasChildren}
                                        title={hasChildren ? 'Cannot delete an entity that has children.' : 'Delete this entity'}>
                                    Delete Entity
                                </button>
                                <button className="new-child-btn" onClick={() => setIsCreateEntityOpen(true)}>
                                    New Child Entity
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="sidebar-placeholder">
                        <p>Select an entity to view details or use search.</p>
                    </div>
                )}
            </aside>
            <EditIri
                isOpen={isEditIriOpen}
                onClose={() => setIsEditIriOpen(false)}
            />
            <EditDefinition
                isOpen={isEditDefinitionOpen}
                onClose={() => setIsEditDefinitionOpen(false)}
            />
            <CreateEntity
                isOpen={isCreateEntityOpen}
                onClose={() => setIsCreateEntityOpen(false)}
                parentIri={selectedEntityIri}
            />
        </>
    );
};
