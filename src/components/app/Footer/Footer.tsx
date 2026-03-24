import './Footer.scss';
import {type CurrentOntologyState, useCurrentOntologyStore} from '../../../stores/ontology-store';
import type {TemporalState} from "zundo";
import {useStore} from "zustand";
import { useViewStore } from '../../../stores/view-store';
import { useAuthStore } from '../../../stores/auth-store';
import clsx from 'clsx';

const useTemporalStore = <T, >(
    selector: (state: TemporalState<CurrentOntologyState>) => T,
    equality?: (a: T, b: T) => boolean,
) => useStore(useCurrentOntologyStore.temporal, selector, equality);

export const Footer = () => {
    const { undo, redo, futureStates, pastStates } = useTemporalStore(
        (state) => state,
    );
    const { view, setView } = useViewStore();
    const { token } = useAuthStore();

    const isDiffActive = view === 'diff';

    if (isDiffActive) return <footer className="footer"></footer>;

    return (
        <footer className="footer">
            <div className="footer-controls">
                <button 
                    onClick={() => undo()} 
                    disabled={!pastStates.length}
                    className="icon-button"
                >
                    <span className="arrow-left"></span>
                    Undo
                </button>
                
                {token && (
                    <button
                        onClick={() => setView('diff')}
                        disabled={!pastStates.length}
                        className={clsx('push-button', { active: pastStates.length })}
                    >
                        Push
                    </button>
                )}

                <button 
                    onClick={() => redo()} 
                    disabled={!futureStates.length}
                    className="icon-button"
                >
                    Redo
                    <span className="arrow-right"></span>
                </button>
            </div>
        </footer>
    );
}
