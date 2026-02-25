import { BranchSelector } from './BranchSelector/BranchSelector';
import './Header.scss';

export const Header = () => (
    <header className="header">
        <div className="header-title">
            <img src="/favicon.png" alt="Logo" />
            <a href="/">EduGraph Demo</a>
        </div>
        <div className="header-controls">
            <BranchSelector />
        </div>
    </header>
);
