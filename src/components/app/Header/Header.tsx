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
import {type CurrentOntologyState, useCurrentOntologyStore} from "../../../stores/ontology-store.ts";
import {useStore} from "zustand";
import type {TemporalState} from "zundo";
import {useViewStore} from "../../../stores/view-store.ts";
import clsx from "clsx";

const useTemporalStore = <T, >(
    selector: (state: TemporalState<CurrentOntologyState>) => T,
    equality?: (a: T, b: T) => boolean,
) => useStore(useCurrentOntologyStore.temporal, selector, equality);


export const Header = () => {
    const [showTokenManager, setShowTokenManager] = useState(false);
    const { token } = useAuthStore();

    const { pastStates } = useTemporalStore(
        (state) => state,
    );
    const { setView } = useViewStore()

    return (
        <header className="header">
            <div className="header-title">
                <img src="/favicon.png" alt="Logo"/>
                <a href="/">EduGraph Editor</a>
            </div>
            <div className="header-controls">
                <button
                    onClick={() => setView('diff')}
                    disabled={!pastStates.length}
                    className={clsx({ active: pastStates.length })}
                >
                    Push
                </button>
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
