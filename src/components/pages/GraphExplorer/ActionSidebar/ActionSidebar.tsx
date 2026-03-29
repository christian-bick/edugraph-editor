import React from 'react';
import './ActionSidebar.scss';
import {FocusMode, useFocusStore} from "../../../../stores/focus-store.ts";
import {useSelectedEntityStore} from "../../../../stores/selected-entity-store.ts";
import {useViewStore} from "../../../../stores/view-store.ts";
import Focus1Icon from '../../../../assets/icons/focus_1.svg';
import Focus2Icon from '../../../../assets/icons/focus_2.svg';
import Focus3Icon from '../../../../assets/icons/focus_3.svg';
import GraphPlainIcon from '../../../../assets/icons/graph_plain.svg';
import GraphInferredIcon from '../../../../assets/icons/graph_inferred.svg';

export const ActionSidebar: React.FC = () => {
    const { activeFocus, setFocus } = useFocusStore();
    const { selectedEntityIri } = useSelectedEntityStore();
    const { showInferredRelations, setShowInferredRelations } = useViewStore();

    const isEntitySelected = selectedEntityIri !== null;

    React.useEffect(() => {
        if (!isEntitySelected && activeFocus !== 'global') {
            setFocus('global');
        }
    }, [isEntitySelected, activeFocus, setFocus]);

    const handleFocusChange = (newFocus: FocusMode) => {
        setFocus(newFocus);
    };

    return (
        <aside className="left-sidebar">
            <div className="focus-group">
                <button
                    className={`sidebar-btn ${activeFocus === 'global' ? 'active' : ''}`}
                    onClick={() => handleFocusChange('global')}
                    title="Global Focus"
                >
                    <img src={Focus1Icon} alt="Global Focus"/>
                </button>
                <button
                    className={`sidebar-btn ${activeFocus === 'ancestry' ? 'active' : ''}`}
                    onClick={() => handleFocusChange('ancestry')}
                    disabled={!isEntitySelected}
                    title={isEntitySelected ? "Ancestry Focus" : "Select an entity for Ancestry Focus"}
                >
                    <img src={Focus2Icon} alt="Ancestry Focus"/>
                </button>
                <button
                    className={`sidebar-btn ${activeFocus === 'local' ? 'active' : ''}`}
                    onClick={() => handleFocusChange('local')}
                    disabled={!isEntitySelected}
                    title={isEntitySelected ? "Local Focus" : "Select an entity for Local Focus"}
                >
                    <img src={Focus3Icon} alt="Local Focus"/>
                </button>
            </div>

            <div className="divider" />

            <div className="view-group">
                <button
                    className={`sidebar-btn ${!showInferredRelations ? 'active' : ''}`}
                    onClick={() => setShowInferredRelations(false)}
                    title="Original Relations Only"
                >
                    <img src={GraphPlainIcon} alt="Original Relations Only"/>
                </button>
                <button
                    className={`sidebar-btn ${showInferredRelations ? 'active' : ''}`}
                    onClick={() => setShowInferredRelations(true)}
                    title="Include Inferred Relations"
                >
                    <img src={GraphInferredIcon} alt="Include Inferred Relations"/>
                </button>
            </div>

            <div className="spacer" />
        </aside>
    );
};
