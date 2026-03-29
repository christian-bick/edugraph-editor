import React, {useMemo, useState} from 'react';
import {useSelectedEntityStore} from '../../../../stores/selected-entity-store';
import {useBranchStore} from '../../../../stores/branch-store.ts';
import './EntitySidebar.scss';
import EditIcon from '../../../../assets/icons/edit.svg';
import PlusIcon from '../../../../assets/icons/plus.svg';
import GeminiIcon from '../../../../assets/icons/gemini.svg';
import {EditDefinition, EditIri} from '../EditEntity/EditEntity.tsx';
import {invertRelations, toNaturalName} from '../../../../stores/utils.ts';
import {useCurrentOntologyStore} from "../../../../stores/ontology-store.ts";
import type {OntologyEntity, RelationType} from "../../../../types/ontology-types.ts";
import {ModifyRelationModal} from '../ModifyRelation/ModifyRelation.tsx';
import {CreateEntity} from '../CreateEntity/CreateEntity.tsx';
import {EntitySearch} from '../EntitySearch/EntitySearch.tsx';
import {getRelationsByPerspective} from '../../../../config/relations.ts';
import clsx from 'clsx';

interface RelationEntity extends OntologyEntity {
    isInferred?: boolean;
}

interface RelationSectionProps {
    title: string;
    entities: RelationEntity[] | undefined;
    isInverse?: boolean;
    minRelations?: number;
    relationName?: RelationType;
    setSelectedEntityIri: (iri: string) => void;
}

const RelationSection: React.FC<RelationSectionProps> = ({
                                                             title,
                                                             entities,
                                                             isInverse = false,
                                                             minRelations = 0,
                                                             relationName,
                                                             setSelectedEntityIri
                                                         }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const isEmpty = !entities || entities.length === 0;

    if (isInverse && isEmpty) {
        return null;
    }

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
                    {entities.map(e => (
                        <li key={e.iri} onClick={() => setSelectedEntityIri(e.iri)} className={clsx({"is-inferred": e.isInferred})}>
                            <span>{toNaturalName(e.name)}</span>
                            {e.isInferred && <img src={GeminiIcon} className="inferred-hint" title="Inferred Relation" alt="Inferred" />}
                        </li>
                    ))}
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
    ontology: any,
    perspective: string
): { [key: string]: RelationEntity[] } => {
    const allEntities = ontology.entities;
    const relationsMap: { [key: string]: RelationEntity[] } = {};

    const addRelations = (relMap: any, isInferred: boolean, inverse: boolean = false) => {
        const perspectiveRelations = getRelationsByPerspective(perspective);
        
        if (inverse) {
            perspectiveRelations.forEach(rel => {
                const inverted = invertRelations(relMap[rel.id] || {});
                if (inverted[entityIri]) {
                    const iris = inverted[entityIri];
                    if (!relationsMap[rel.inverseId]) relationsMap[rel.inverseId] = [];
                    
                    iris.forEach(iri => {
                        const ent = allEntities.find((e: any) => e.iri === iri);
                        if (ent && !relationsMap[rel.inverseId].some(r => r.iri === ent.iri)) {
                            relationsMap[rel.inverseId].push({ ...ent, isInferred });
                        }
                    });
                }
            });
        } else {
            for (const relType in relMap) {
                if (relMap[relType]?.[entityIri]) {
                    const iris = relMap[relType][entityIri];
                    if (!relationsMap[relType]) relationsMap[relType] = [];
                    
                    iris.forEach((iri: string) => {
                        const ent = allEntities.find((e: any) => e.iri === iri);
                        if (ent && !relationsMap[relType].some(r => r.iri === ent.iri)) {
                            relationsMap[relType].push({ ...ent, isInferred });
                        }
                    });
                }
            }
        }
    };

    // 1. Process direct relations
    addRelations(ontology.relations, false);
    if (ontology.inferredRelations) {
        addRelations(ontology.inferredRelations, true);
    }

    // 2. Process inverse relations
    addRelations(ontology.relations, false, true);
    if (ontology.inferredRelations) {
        addRelations(ontology.inferredRelations, true, true);
    }

    return relationsMap;
};

export const EntitySidebar: React.FC = () => {
    const {selectedEntityIri, setSelectedEntityIri} = useSelectedEntityStore();
    const {ontologies, deleteEntity} = useCurrentOntologyStore();
    const {activeDimension, activePerspective} = useBranchStore();
    const [isEditIriOpen, setIsEditIriOpen] = useState(false);
    const [isEditDefinitionOpen, setIsEditDefinitionOpen] = useState(false);
    const [isCreateEntityOpen, setIsCreateEntityOpen] = useState(false);

    const selectedEntity = useMemo(() => {
        if (!selectedEntityIri) return null;
        const ontology = ontologies[activeDimension as keyof typeof ontologies];
        if (!ontology) return null;

        const entity = ontology.entities.find(e => e.iri === selectedEntityIri);
        if (!entity) return null;

        const relations = computeEntityRelations(selectedEntityIri, ontology, activePerspective);

        return {
            ...entity,
            relations,
        };
    }, [selectedEntityIri, ontologies, activeDimension, activePerspective]);

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

    const currentPerspectiveRelations = useMemo(() =>
            getRelationsByPerspective(activePerspective),
        [activePerspective]);

    return (
        <>
            <aside className="graph-explorer-sidebar">
                {selectedEntity ? (
                    <>
                        <div className="sidebar-content">
                            <div className="sidebar-section">
                                <h2>{toNaturalName(selectedEntity.name)}</h2>
                            </div>

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
                                {currentPerspectiveRelations
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
                                        />
                                    ))}
                            </div>

                            <div className="relations-group inverse">
                                {currentPerspectiveRelations
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
                                        />
                                    ))
                                }
                            </div>
                        </div>
                        {activeDimension === 'Area' && activePerspective === 'Taxonomy' && (
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
                        )}
                    </>
                ) : (
                    <EntitySearch/>
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
