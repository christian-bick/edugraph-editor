

import './Header.scss';
import {NavButton} from "./NavButton/NavButton.tsx";

export const Header = () => (
    <header className="header">
        <div className="header-title">
            ImagineBase
        </div>
        <div className="header-nav">
            <NavButton label="Develop"/>
            <NavButton label="Analyze"/>
            <NavButton label="Explore" active={true} />
        </div>
    </header>
);
