import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Modal} from '../../../global/Modal/Modal';
import {useCurrentOntologyStore} from '../../../../stores/ontology-store';
import {useSelectedEntityStore} from '../../../../stores/selected-entity-store';
import {useBranchStore} from '../../../../stores/branch-store';
import {getPredecessors, toNaturalName} from '../../../../stores/utils';
import type {OntologyEntity, RelationType} from '../../../../types/ontology-types';
import './ModifyRelation.scss';
import LinkRmIcon from '../../../../assets/icons/link_rm.svg';
import GraphParentIcon from '../../../../assets/icons/graph_parent.svg';
import {getRelationsByPerspective} from '../../../../config/relations.ts';
import clsx from 'clsx';
import {ActionButton} from '../../../global/ActionButton/ActionButton';

interface RelationEntity extends OntologyEntity {
    isInferred?: boolean;
    inferredFromIri?: string;
}

interface ModifyRelationModalProps {
    isOpen: boolean;
    onClose: () => void;
    relationTitle: string;
    relationName: RelationType;
    existingRelations: RelationEntity[];
    minRelations?: number;
}

export const ModifyRelationModal: React.FC<ModifyRelationModalProps> = ({ isOpen, onClose, relationTitle, relationName, existingRelations, minRelations = 0 }) => {
    const { ontologies, updateRelations } = useCurrentOntologyStore();
    const { selectedEntityIri } = useSelectedEntityStore();
    const { activeDimension, activePerspective } = useBranchStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [currentRelations, setCurrentRelations] = useState<RelationEntity[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [expandedIris, setExpandedIris] = useState<Set<string>>(new Set());
    const resultsRef = useRef<HTMLDivElement>(null);

    const sourceEntity = useMemo(() => {
        const ontology = ontologies[activeDimension];
        return ontology?.entities.find(e => e.iri === selectedEntityIri);
    }, [ontologies, activeDimension, selectedEntityIri]);

    const sourceName = sourceEntity ? toNaturalName(sourceEntity.name) : '';

    useEffect(() => {
        if (isOpen) {
            setCurrentRelations(existingRelations);
        } else {
            setSearchQuery('');
            setHighlightedIndex(-1);
            setExpandedIris(new Set());
        }
    }, [isOpen, existingRelations]);

    const { availableEntities, disabledIris } = useMemo(() => {
        if (!selectedEntityIri) return { availableEntities: [], disabledIris: new Set<string>() };

        const ontology = ontologies[activeDimension];
        if (!ontology) return { availableEntities: [], disabledIris: new Set<string>() };

        const perspectiveRelations = getRelationsByPerspective(activePerspective);
        const relationsToFollow = perspectiveRelations.map(rel => rel.id);

        const predecessors = getPredecessors(selectedEntityIri, ontology.relations, relationsToFollow);
        const currentRelationIris = new Set(currentRelations.map(e => e.iri));
        const selfIri = new Set([selectedEntityIri]);

        const newDisabledIris = new Set([...predecessors, ...currentRelationIris, ...selfIri]);

        const filteredEntities = searchQuery
            ? ontology.entities.filter(e =>
                toNaturalName(e.name).toLowerCase().includes(searchQuery.toLowerCase())
            )
            : [];

        return { availableEntities: filteredEntities, disabledIris: newDisabledIris };
    }, [ontologies, activeDimension, selectedEntityIri, activePerspective, currentRelations, searchQuery]);

    useEffect(() => {
        if (highlightedIndex >= 0 && resultsRef.current) {
            const element = resultsRef.current.children[highlightedIndex] as HTMLElement;
            if (element) {
                element.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    const handleAddRelation = (entity: OntologyEntity) => {
        setCurrentRelations(prev => [...prev, { ...entity, isInferred: false }]);
        setSearchQuery('');
        setHighlightedIndex(-1);
    };

    const handleRemoveRelation = (iri: string) => {
        setCurrentRelations(prev => prev.filter(e => e.iri !== iri));
    };

    const toggleDefinition = (iri: string) => {
        setExpandedIris(prev => {
            const next = new Set(prev);
            if (next.has(iri)) next.delete(iri);
            else next.add(iri);
            return next;
        });
    };

    const handleSave = async () => {
        if (!selectedEntityIri) return;

        // Only save non-inferred relations back to the store
        const objectIris = currentRelations
            .filter(e => !e.isInferred)
            .map(e => e.iri);

        updateRelations(activeDimension, selectedEntityIri, relationName, objectIris);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (availableEntities.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % availableEntities.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + availableEntities.length) % availableEntities.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0) {
                const entity = availableEntities[highlightedIndex];
                if (!disabledIris.has(entity.iri)) {
                    handleAddRelation(entity);
                }
            }
        } else if (e.key === 'Escape') {
            setSearchQuery('');
        }
    };

    const originalRelationsCount = currentRelations.filter(e => !e.isInferred).length;
    const canRemoveOriginal = originalRelationsCount > minRelations;

    if (!isOpen) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="modify-relation-modal">
                <h2>{sourceName}</h2>
                <h3 className="modal-subtitle">Manage "{relationTitle}" Relations</h3>

                <div className="form-group search-container">
                    <input
                        id="search-entities"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setHighlightedIndex(-1);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Search to add relation..."
                        autoComplete="off"
                    />
                    {searchQuery && (
                        <div className="search-results" ref={resultsRef}>
                            {availableEntities.map((entity, index) => (
                                <div
                                    key={entity.iri}
                                    className={`search-result-item ${disabledIris.has(entity.iri) ? 'disabled' : ''} ${index === highlightedIndex ? 'highlighted' : ''}`}
                                    onMouseDown={() => {
                                        if (!disabledIris.has(entity.iri)) {
                                            handleAddRelation(entity);
                                        }
                                    }}
                                >
                                    {toNaturalName(entity.name)}
                                </div>
                            ))}
                            {availableEntities.length === 0 && <div className="search-result-item disabled">No results</div>}
                        </div>
                    )}
                </div>

                <div className="current-relations-list">
                    <ul>
                        {currentRelations.map(entity => (
                            <li key={entity.iri} className={clsx("relation-item", { "is-inferred": entity.isInferred })}>
                                <div className="relation-item-content">
                                    <div className="relation-item-main">
                                        <button
                                            className={clsx("toggle-definition-btn", { expanded: expandedIris.has(entity.iri) })}
                                            onClick={() => toggleDefinition(entity.iri)}
                                            title="Toggle definition"
                                        >
                                            ▶
                                        </button>
                                        <span className="relation-item-name">{toNaturalName(entity.name)}</span>

                                        {entity.isInferred && (
                                            <img src={GraphParentIcon} className="inferred-hint" title="Inferred Relation" alt="Inferred" />
                                        )}

                                        {!entity.isInferred && canRemoveOriginal && (
                                            <button className="remove-btn" onClick={() => handleRemoveRelation(entity.iri)}>
                                                <img src={LinkRmIcon} alt="Remove"/>
                                            </button>
                                        )}
                                    </div>
                                    {expandedIris.has(entity.iri) && (
                                        <div className="relation-item-definition">
                                            {entity.definition || <i>No definition available.</i>}
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                        {currentRelations.length === 0 && <li className="no-relations">No relations of this type.</li>}
                    </ul>
                </div>

                <div className="form-actions">
                    <button onClick={onClose} className="secondary">Cancel</button>
                    <ActionButton onClick={handleSave} className="primary" requireGithubAuth>
                        Save
                    </ActionButton>
                </div>
            </div>
        </Modal>
    );
};
