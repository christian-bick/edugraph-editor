import { BranchSelector } from './BranchSelector/BranchSelector';
import { DimensionSelector } from './DimensionSelector/DimensionSelector';
import { PerspectiveSelector } from "./PerspectiveSelector/PerspectiveSelector.tsx";
import './Header.scss';
import GithubIcon from '../../../assets/icons/github.svg';
import {TokenManager} from "../TokenManager/TokenManager.tsx";
import {useState} from "react";

export const Header = () => {
    const [showTokenManager, setShowTokenManager] = useState(false);

    return (
        <header className="header">
            <div className="header-title">
                <img src="/favicon.png" alt="Logo"/>
                <a href="/">EduGraph Editor</a>
            </div>
            <div className="header-controls">
                <BranchSelector/>
                <DimensionSelector/>
                <PerspectiveSelector/>
                <div className="github-token-manager">
                    <button className="github-icon" onClick={() => setShowTokenManager(!showTokenManager)}>
                        <img src={GithubIcon} alt="GitHub Token"/>
                    </button>
                    {showTokenManager && (
                        <div className="token-manager-container">
                            <TokenManager />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
