import { BranchSelector } from './BranchSelector/BranchSelector';
import { DimensionSelector } from './DimensionSelector/DimensionSelector';
import { PerspectiveSelector } from "./PerspectiveSelector/PerspectiveSelector.tsx";
import './Header.scss';

export const Header = () => (
    <header className="header">
        <div className="header-title">
            <img src="/favicon.png" alt="Logo" />
            <a href="/">EduGraph Editor</a>
        </div>
        <div className="header-controls">
            <BranchSelector />
            <DimensionSelector />
            <PerspectiveSelector />
        </div>
    </header>
);
