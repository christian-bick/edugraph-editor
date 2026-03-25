import React, {useMemo, useState} from 'react';
import {useSelectedEntityStore} from '../../../../stores/selected-entity-store';
import {useBranchStore} from '../../../../stores/branch-store.ts';
import './Sidebar.scss';
import EditIcon from '../../../../assets/icons/edit.svg';
import {EditDefinition, EditIri} from '../EditEntity/EditEntity.tsx';
import {invertRelations, toNaturalName} from '../../../../stores/utils.ts';
import {useCurrentOntologyStore} from "../../../../stores/ontology-store.ts";
import type {OntologyEntity, RelationType} from "../../../../types/ontology-types.ts";
import { AddRelationModal } from '../AddRelation/AddRelation.tsx';
import { CreateEntity } from '../CreateEntity/CreateEntity.tsx';
import { EntitySearch } from '../EntitySearch/EntitySearch.tsx';
import { getRelationsByPerspective } from '../../../../config/relations.ts';

interface RelationSectionProps {
    title: string;
    entities: OntologyEntity[] | undefined;
    isInverse?: boolean;
    minRelations?: number;
    relationName?: RelationType;
    setSelectedEntityIri: (iri: string) => void;
}

const RelationSection: React.FC<RelationSectionProps> = ({ title, entities, isInverse = false, minRelations = 0, relationName, setSelectedEntityIri }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    if (isInverse && (!entities || entities.length === 0)) {
        return null;
    }

    return (
        <div className="sidebar-section">
            <div className="sidebar-header">
                <h3>{title}</h3>
                {!isInverse && (
                    <button className="edit-btn" onClick={() => setIsAddModalOpen(true)}>
                        <img src={EditIcon} alt="Add Relation"/>
                    </button>
                )}
            </div>
            {entities && entities.length > 0 && (
                <ul>
                    {entities.map(e => (
                        <li key={e.iri} onClick={() => setSelectedEntityIri(e.iri)}>
                            <span>{toNaturalName(e.name)}</span>
                        </li>
                    ))}
                </ul>
            )}
            {relationName && <AddRelationModal
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
 * Computes all relations for an entity, merging direct and inverse lists for symmetric relations.
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
            const entities = iris
                .map((iri: string) => allEntities.find((e: any) => e.iri === iri))
                .filter(Boolean);

            if (rel.id === rel.inverseId) {
                // Symmetric: Merge into the direct relation list and deduplicate
                const direct = relationsMap[rel.id] || [];
                const combined = [...direct, ...entities];
                const seen = new Set<string>();
                relationsMap[rel.id] = combined.filter(e => {
                    if (seen.has(e.iri)) return false;
                    seen.add(e.iri);
                    return true;
                });
            } else {
                relationsMap[rel.inverseId] = entities;
            }
        }
    });

    return relationsMap;
};

export const Sidebar: React.FC = () => {
    const { selectedEntityIri, setSelectedEntityIri } = useSelectedEntityStore();
    const { ontologies, deleteEntity } = useCurrentOntologyStore();
    const { activeDimension, activePerspective } = useBranchStore();
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

                            {currentPerspectiveRelations.map(rel => (
                                <React.Fragment key={rel.id}>
                                    <RelationSection 
                                        title={rel.label} 
                                        relationName={rel.id} 
                                        entities={selectedEntity.relations[rel.id]} 
                                        minRelations={rel.id === 'partOf' ? 1 : 0}
                                        setSelectedEntityIri={setSelectedEntityIri} 
                                    />
                                    {rel.id !== rel.inverseId && (
                                        <RelationSection 
                                            title={rel.inverseLabel} 
                                            entities={selectedEntity.relations[rel.inverseId]} 
                                            isInverse 
                                            setSelectedEntityIri={setSelectedEntityIri} 
                                        />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        
                        <div className="sidebar-footer">
                            {activeDimension === 'Area' && activePerspective === 'Taxonomy' && (
                                <div className="footer-buttons">
                                    <button className="delete-btn" onClick={handleDelete} disabled={hasChildren} title={hasChildren ? 'Cannot delete an entity that has children.' : 'Delete this entity'}>
                                        Delete Entity
                                    </button>
                                    <button className="new-child-btn" onClick={() => setIsCreateEntityOpen(true)}>
                                        New Child Entity
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <EntitySearch />
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
