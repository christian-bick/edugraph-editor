import { BranchSelector } from './BranchSelector/BranchSelector';
import { DimensionSelector } from './DimensionSelector/DimensionSelector';
import { PerspectiveSelector } from "./PerspectiveSelector/PerspectiveSelector.tsx";
import './Header.scss';
import GithubIcon from '../../../assets/icons/github.svg';
import GeminiIcon from '../../../assets/icons/gemini.svg';
import {TokenManager} from "../TokenManager/TokenManager.tsx";
import {GeminiTokenManager} from "../TokenManager/GeminiTokenManager.tsx";
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
    const [showGithubTokenManager, setShowGithubTokenManager] = useState(false);
    const [showGeminiTokenManager, setShowGeminiTokenManager] = useState(false);
    const { token, geminiToken } = useAuthStore();

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
                {token && (
                    <button
                        onClick={() => setView('diff')}
                        disabled={!pastStates.length}
                        className={clsx({ active: pastStates.length })}
                    >
                        Push
                    </button>
                )}
                <BranchSelector/>
                <DimensionSelector/>
                <PerspectiveSelector/>
                <div className="token-managers">
                    <button className={clsx('github-icon', { 'token-present': token })} onClick={() => setShowGithubTokenManager(true)}>
                        <img src={GithubIcon} alt="GitHub Token"/>
                    </button>
                    <button className={clsx('gemini-icon', { 'token-present': geminiToken })} onClick={() => setShowGeminiTokenManager(true)}>
                        <img src={GeminiIcon} alt="Gemini Token"/>
                    </button>
                </div>

                <Modal isOpen={showGithubTokenManager} onClose={() => setShowGithubTokenManager(false)}>
                    <TokenManager />
                </Modal>
                <Modal isOpen={showGeminiTokenManager} onClose={() => setShowGeminiTokenManager(false)}>
                    <GeminiTokenManager />
                </Modal>
            </div>
        </header>
    );
}
