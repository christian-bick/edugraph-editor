import React from 'react';
import './ActionSidebar.scss';
import {FocusMode, useFocusStore} from "../../../../stores/focus-store.ts";
import Focus1Icon from '../../../../assets/icons/focus_1.svg';
import Focus2Icon from '../../../../assets/icons/focus_2.svg';
import Focus3Icon from '../../../../assets/icons/focus_3.svg';

export const ActionSidebar: React.FC = () => {
    const { focus, setFocus } = useFocusStore();

    const handleFocusChange = (newFocus: FocusMode) => {
        setFocus(newFocus);
    };

    return (
        <aside className="left-sidebar">
            <button
                className={`focus-btn ${focus === 'global' ? 'active' : ''}`}
                onClick={() => handleFocusChange('global')}
                title="Global Focus"
            >
                <img src={Focus1Icon} alt="Global Focus"/>
            </button>
            <button
                className={`focus-btn ${focus === 'ancestry' ? 'active' : ''}`}
                onClick={() => handleFocusChange('ancestry')}
                title="Ancestry Focus"
            >
                <img src={Focus2Icon} alt="Ancestry Focus"/>
            </button>
            <button
                className={`focus-btn ${focus === 'local' ? 'active' : ''}`}
                onClick={() => handleFocusChange('local')}
                title="Local Focus"
            >
                <img src={Focus3Icon} alt="Local Focus"/>
            </button>
        </aside>
    );
};
