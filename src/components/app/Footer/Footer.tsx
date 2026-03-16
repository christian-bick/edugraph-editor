import './Footer.scss';
import { useTemporalOntologyStore } from '../../../stores/ontology-store';

export const Footer = () => {
    const { undo, redo, futureStates, pastStates } = useTemporalOntologyStore.temporal.getState();

    return (
        <footer className="footer">
            <div className="undo-redo-controls">
                <button onClick={undo} disabled={!pastStates.length}>Undo</button>
                <button onClick={redo} disabled={!futureStates.length}>Redo</button>
            </div>
        </footer>
    );
}
