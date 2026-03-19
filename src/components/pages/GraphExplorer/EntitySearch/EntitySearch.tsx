import React, { useMemo, useState } from 'react';
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

    const searchResults = useMemo(() => {
        const ontology = ontologies[activeDimension];
        if (!searchQuery || !ontology) {
            return [];
        }
        return ontology.entities.filter(e =>
            toNaturalName(e.name).toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, ontologies, activeDimension]);

    const handleSelect = (iri: string) => {
        setSelectedEntityIri(iri);
        setSearchQuery('');
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
                />
            </div>
            <div className="search-results-list">
                {searchResults.map(entity => (
                    <div
                        key={entity.iri}
                        className="result-item"
                        onClick={() => handleSelect(entity.iri)}
                    >
                        {toNaturalName(entity.name)}
                    </div>
                ))}
            </div>
        </div>
    );
};
