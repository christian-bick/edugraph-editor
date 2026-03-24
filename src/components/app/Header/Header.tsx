import { BranchSelector } from './BranchSelector/BranchSelector';
import { DimensionSelector } from './DimensionSelector/DimensionSelector';
import { PerspectiveSelector } from "./PerspectiveSelector/PerspectiveSelector.tsx";
import './Header.scss';
import GithubIcon from '../../../assets/icons/github.svg';
import GeminiIcon from '../../../assets/icons/gemini.svg';
import RefreshIcon from '../../../assets/icons/refresh.svg';
import {TokenManager} from "../TokenManager/TokenManager.tsx";
import {GeminiTokenManager} from "../TokenManager/GeminiTokenManager.tsx";
import {useState} from "react";
import {useAuthStore} from "../../../stores/auth-store.ts";
import {useBranchStore} from "../../../stores/branch-store.ts";
import {Modal} from "../../global/Modal/Modal.tsx";
import clsx from "clsx";

export const Header = () => {
    const [showGithubTokenManager, setShowGithubTokenManager] = useState(false);
    const [showGeminiTokenManager, setShowGeminiTokenManager] = useState(false);
    const { token, geminiToken } = useAuthStore();
    const { fetchBranches, loading } = useBranchStore();

    return (
        <header className="header">
            <div className="header-title">
                <img src="/favicon.png" alt="Logo"/>
                <a href="/">EduGraph Editor</a>
            </div>
            <div className="header-controls">
                <button 
                    className={clsx('refresh-button', { loading })} 
                    onClick={() => fetchBranches()}
                    disabled={loading}
                    title="Refresh Branches"
                >
                    <img src={RefreshIcon} alt="Refresh"/>
                </button>
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
