import React from 'react';
import { useSelectedEntityStore } from '../../../../stores/selected-entity-store';
import { useBranchStore } from '../../../../stores/branch-store.ts';
import './Sidebar.scss';

export const Sidebar: React.FC = () => {
    const { selectedEntity } = useSelectedEntityStore();
    const { activePerspective } = useBranchStore();

    const renderRelations = () => {
        if (!selectedEntity) return null;

        if (activePerspective === 'Progression') {
            return (
                <>
                    {selectedEntity.relations.expands && (
                        <>
                            <h4>Expands</h4>
                            <ul>
                                {selectedEntity.relations.expands.map(e => <li key={e.iri}>{e.natural_name}</li>)}
                            </ul>
                        </>
                    )}
                    {selectedEntity.relations.expandedBy && (
                        <>
                            <h4>Expanded By</h4>
                            <ul>
                                {selectedEntity.relations.expandedBy.map(e => <li key={e.iri}>{e.natural_name}</li>)}
                            </ul>
                        </>
                    )}
                </>
            );
        } else {
            return (
                <>
                    {selectedEntity.relations.partOf && (
                        <>
                            <h4>Parents</h4>
                            <ul>
                                {selectedEntity.relations.partOf.map(e => <li key={e.iri}>{e.natural_name}</li>)}
                            </ul>
                        </>
                    )}

                    {selectedEntity.relations.hasPart && (
                        <>
                            <h4>Children</h4>
                            <ul>
                                {selectedEntity.relations.hasPart.map(e => <li key={e.iri}>{e.natural_name}</li>)}
                            </ul>
                        </>
                    )}
                </>
            );
        }
    };

    return (
        <aside className="graph-explorer-sidebar">
            {selectedEntity ? (
                <>
                    <h3>{selectedEntity.natural_name}</h3>
                    <p>{selectedEntity.definition}</p>
                    {renderRelations()}
                </>
            ) : (
                <div>Select a node to see details.</div>
            )}
        </aside>
    );
};

