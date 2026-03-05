import React from 'react';
import { useSelectedEntityStore } from '../../../../stores/selected-entity-store';
import './Sidebar.scss';

export const Sidebar: React.FC = () => {
    const { selectedEntity } = useSelectedEntityStore();

    return (
        <aside className="graph-explorer-sidebar">
            {selectedEntity ? (
                <>
                    <h3>{selectedEntity.natural_name}</h3>
                    <p>{selectedEntity.definition}</p>

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
            ) : (
                <div>Select a node to see details.</div>
            )}
        </aside>
    );
};

