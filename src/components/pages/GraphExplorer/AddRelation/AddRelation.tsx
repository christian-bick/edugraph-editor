import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Modal } from '../../../global/Modal/Modal';
import { useCurrentOntologyStore } from '../../../../stores/ontology-store';
import { useSelectedEntityStore } from '../../../../stores/selected-entity-store';
import { useBranchStore } from '../../../../stores/branch-store';
import { getSuccessors, invertRelations, toNaturalName } from '../../../../stores/utils';
import type { OntologyEntity, RelationType } from '../../../../types/ontology-types';
import './AddRelation.scss';
import LinkRmIcon from '../../../../assets/icons/link_rm.svg';

interface AddRelationModalProps {
    isOpen: boolean;
    onClose: () => void;
    relationTitle: string;
    relationName: RelationType;
    existingRelations: OntologyEntity[];
    minRelations?: number;
}

export const AddRelationModal: React.FC<AddRelationModalProps> = ({ isOpen, onClose, relationTitle, relationName, existingRelations, minRelations = 0 }) => {
    const { ontologies, updateRelations } = useCurrentOntologyStore();
    const { selectedEntityIri } = useSelectedEntityStore();
    const { activeDimension, activePerspective } = useBranchStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [currentRelations, setCurrentRelations] = useState<OntologyEntity[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setCurrentRelations(existingRelations);
        } else {
            setSearchQuery('');
            setHighlightedIndex(-1);
        }
    }, [isOpen, existingRelations]);

    const { availableEntities, disabledIris } = useMemo(() => {
        if (!selectedEntityIri) return { availableEntities: [], disabledIris: new Set<string>() };

        const ontology = ontologies[activeDimension];
        if (!ontology) return { availableEntities: [], disabledIris: new Set<string>() };

        const allRelations = {
            ...ontology.relations,
            hasPart: invertRelations(ontology.relations.partOf),
            expandedBy: invertRelations(ontology.relations.expands),
            includedIn: invertRelations(ontology.relations.includes),
        };

        const relationsToFollow = activePerspective === 'Progression' ? ['expands', 'includes'] : ['hasPart'];
        const successors = getSuccessors(selectedEntityIri, allRelations, relationsToFollow);
        const currentRelationIris = new Set(currentRelations.map(e => e.iri));
        const selfIri = new Set([selectedEntityIri]);

        const newDisabledIris = new Set([...successors, ...currentRelationIris, ...selfIri]);

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
        setCurrentRelations(prev => [...prev, entity]);
        setSearchQuery('');
        setHighlightedIndex(-1);
    };

    const handleRemoveRelation = (iri: string) => {
        setCurrentRelations(prev => prev.filter(e => e.iri !== iri));
    };

    const handleSave = () => {
        if (!selectedEntityIri) return;

        const objectIris = currentRelations.map(e => e.iri);
        updateRelations(activeDimension, selectedEntityIri, relationName, objectIris);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

    const showRemoveButton = currentRelations.length > minRelations;

    if (!isOpen) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2>Manage "{relationTitle}" Relations</h2>

            <div className="form-group search-container">
                <label htmlFor="search-entities">Search to add relation</label>
                <input
                    id="search-entities"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setHighlightedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Start typing to search..."
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
                        <li key={entity.iri}>
                            <span>{toNaturalName(entity.name)}</span>
                            {showRemoveButton && (
                                <button className="remove-btn" onClick={() => handleRemoveRelation(entity.iri)}>
                                    <img src={LinkRmIcon} alt="Remove"/>
                                </button>
                            )}
                        </li>
                    ))}
                    {currentRelations.length === 0 && <li className="no-relations">No relations of this type.</li>}
                </ul>
            </div>

            <div className="form-actions">
                <button onClick={onClose}>Cancel</button>
                <button onClick={handleSave} className="primary">Save</button>
            </div>
        </Modal>
    );
};
