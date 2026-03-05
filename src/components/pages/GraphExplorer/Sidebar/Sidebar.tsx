import React from 'react';
import {useSelectedEntityStore} from '../../../../stores/selected-entity-store';
import './Sidebar.scss';

export const Sidebar: React.FC = () => {
    const { selectedEntity } = useSelectedEntityStore();

    return (
        <aside className="graph-explorer-sidebar">
            {selectedEntity ? (
                <>
                    <h3>{selectedEntity.natural_name}</h3>
                    <p>{selectedEntity.definition}</p>
                </>
            ) : (
                <div>Select a node to see details.</div>
            )}
        </aside>
    );
};
