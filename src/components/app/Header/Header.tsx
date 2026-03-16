import { BranchSelector } from './BranchSelector/BranchSelector';
import { DimensionSelector } from './DimensionSelector/DimensionSelector';
import { PerspectiveSelector } from "./PerspectiveSelector/PerspectiveSelector.tsx";
import './Header.scss';
import GithubIcon from '../../../assets/icons/github.svg';
import GithubDarkGreenIcon from '../../../assets/icons/github-dark-green.svg';
import {TokenManager} from "../TokenManager/TokenManager.tsx";
import {useState} from "react";
import {useAuthStore} from "../../../stores/auth-store.ts";
import {Modal} from "../../global/Modal/Modal.tsx";
import { useTemporalOntologyStore } from '../../../stores/ontology-store';

export const Header = () => {
    const [showTokenManager, setShowTokenManager] = useState(false);
    const { token } = useAuthStore();
    const { undo, redo, futureStates, pastStates } = useTemporalOntologyStore.temporal.getState();

    return (
        <header className="header">
            <div className="header-title">
                <img src="/favicon.png" alt="Logo"/>
                <a href="/">EduGraph Editor</a>
            </div>
            <div className="header-controls">
                <div className="undo-redo-controls">
                    <button onClick={undo} disabled={!pastStates.length}>Undo</button>
                    <button onClick={redo} disabled={!futureStates.length}>Redo</button>
                </div>
                <BranchSelector/>
                <DimensionSelector/>
                <PerspectiveSelector/>
                <button className="github-icon" onClick={() => setShowTokenManager(true)}>
                    <img src={token ? GithubDarkGreenIcon : GithubIcon} alt="GitHub Token"/>
                </button>
                <Modal isOpen={showTokenManager} onClose={() => setShowTokenManager(false)}>
                    <TokenManager />
                </Modal>
            </div>
        </header>
    );
}
