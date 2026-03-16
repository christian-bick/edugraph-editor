import './Footer.scss';
import {type CurrentOntologyState, useCurrentOntologyStore} from '../../../stores/ontology-store';
import type {TemporalState} from "zundo";
import {useStore} from "zustand/react";

const useTemporalStore = <T extends TemporalState<CurrentOntologyState>>(
    selector: (state: TemporalState<CurrentOntologyState>) => T,
    equality?: (a: T, b: T) => boolean,
) => useStore(useCurrentOntologyStore.temporal, selector, equality);


export const Footer = () => {
    const { undo, redo, futureStates, pastStates } = useTemporalStore(
        (state) => state,
    );

    return (
        <footer className="footer">
            <div className="undo-redo-controls">
                <button onClick={() => undo()} disabled={!pastStates.length}>Undo</button>
                <button onClick={() => redo()} disabled={!futureStates.length}>Redo</button>
            </div>
        </footer>
    );
}
