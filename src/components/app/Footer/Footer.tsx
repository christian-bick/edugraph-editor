import './Footer.scss';
import {type CurrentOntologyState, useCurrentOntologyStore} from '../../../stores/ontology-store';
import type {TemporalState} from "zundo";
import {useStore} from "zustand";
import { useViewStore } from '../../../stores/view-store';
import clsx from 'clsx';

const useTemporalStore = <T, >(
    selector: (state: TemporalState<CurrentOntologyState>) => T,
    equality?: (a: T, b: T) => boolean,
) => useStore(useCurrentOntologyStore.temporal, selector, equality);

export const Footer = () => {
    const { undo, redo, futureStates, pastStates } = useTemporalStore(
        (state) => state,
    );
    const { view, toggleView } = useViewStore();

    const isDiffActive = view === 'diff';

    return (
        <footer className="footer">
            <div className="undo-redo-controls">
                <button onClick={() => undo()} disabled={!pastStates.length || isDiffActive}>Undo</button>
                <button
                    onClick={toggleView}
                    disabled={!pastStates.length}
                    className={clsx({ active: isDiffActive })}
                >
                    Diff
                </button>
                <button onClick={() => redo()} disabled={!futureStates.length || isDiffActive}>Redo</button>
            </div>
        </footer>
    );
}
