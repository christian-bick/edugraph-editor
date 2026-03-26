import React, {useMemo, useState} from 'react';
import {useSelectedEntityStore} from '../../../../stores/selected-entity-store';
import {useBranchStore} from '../../../../stores/branch-store.ts';
import './EntitySidebar.scss';
import EditIcon from '../../../../assets/icons/edit.svg';
import PlusIcon from '../../../../assets/icons/plus.svg';
import {EditDefinition, EditIri} from '../EditEntity/EditEntity.tsx';
import {invertRelations, toNaturalName} from '../../../../stores/utils.ts';
import {useCurrentOntologyStore} from "../../../../stores/ontology-store.ts";
import type {OntologyEntity, RelationType} from "../../../../types/ontology-types.ts";
import {ModifyRelationModal} from '../ModifyRelation/ModifyRelation.tsx';
import {CreateEntity} from '../CreateEntity/CreateEntity.tsx';
import {EntitySearch} from '../EntitySearch/EntitySearch.tsx';
import {getRelationsByPerspective} from '../../../../config/relations.ts';
import clsx from 'clsx';

interface RelationSectionProps {
    title: string;
    entities: OntologyEntity[] | undefined;
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
                        <li key={e.iri} onClick={() => setSelectedEntityIri(e.iri)}>
                            <span>{toNaturalName(e.name)}</span>
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
 * Computes all relations for an entity.
 */
const computeEntityRelations = (
    entityIri: string,
    ontology: any,
    perspective: string
): { [key: string]: OntologyEntity[] } => {
    const allEntities = ontology.entities;
    const relationsMap: { [key: string]: OntologyEntity[] } = {};

    // 1. Process all direct relations
    for (const relType in ontology.relations) {
        if (ontology.relations[relType]?.[entityIri]) {
            const iris = ontology.relations[relType][entityIri];
            relationsMap[relType] = iris
                .map((iri: string) => allEntities.find((e: any) => e.iri === iri))
                .filter(Boolean);
        }
    }

    // 2. Process inverse relations from config
    const perspectiveRelations = getRelationsByPerspective(perspective);
    perspectiveRelations.forEach(rel => {
        const inverted = invertRelations(ontology.relations[rel.id] || {});
        if (inverted[entityIri]) {
            const iris = inverted[entityIri];
            relationsMap[rel.inverseId] = iris
                .map((iri: string) => allEntities.find((e: any) => e.iri === iri))
                .filter(Boolean);
        }
    });

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
                                    <h3>Description</h3>
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
