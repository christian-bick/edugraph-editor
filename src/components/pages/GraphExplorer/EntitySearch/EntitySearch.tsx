import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useCurrentOntologyStore } from '../../../../stores/ontology-store';
import { useBranchStore } from '../../../../stores/branch-store';
import { useSelectedEntityStore } from '../../../../stores/selected-entity-store';
import { toNaturalName } from '../../../../stores/utils';
import './EntitySearch.scss';

export const EntitySearch: React.FC = () => {
    const { ontologies } = useCurrentOntologyStore();
    const { activeDimension } = useBranchStore();
    const { setSelectedEntityIri } = useSelectedEntityStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const resultsRef = useRef<HTMLDivElement>(null);

    const searchResults = useMemo(() => {
        const ontology = ontologies[activeDimension];
        if (!searchQuery || !ontology) {
            return [];
        }
        return ontology.entities.filter(e =>
            toNaturalName(e.name).toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, ontologies, activeDimension]);

    useEffect(() => {
        setHighlightedIndex(-1);
    }, [searchQuery]);

    useEffect(() => {
        if (highlightedIndex >= 0 && resultsRef.current) {
            const element = resultsRef.current.children[highlightedIndex] as HTMLElement;
            if (element) {
                element.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    const handleSelect = (iri: string) => {
        setSelectedEntityIri(iri);
        setSearchQuery('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (searchResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % searchResults.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0) {
                handleSelect(searchResults[highlightedIndex].iri);
            }
        } else if (e.key === 'Escape') {
            setSearchQuery('');
        }
    };

    return (
        <div className="entity-search-container">
            <h4>Find Entity</h4>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>
            {searchResults.length > 0 && (
                <div className="search-results-list" ref={resultsRef}>
                    {searchResults.map((entity, index) => (
                        <div
                            key={entity.iri}
                            className={`result-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                            onClick={() => handleSelect(entity.iri)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            {toNaturalName(entity.name)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
