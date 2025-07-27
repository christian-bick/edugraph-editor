import React from 'react';

import './Footer.scss';
import {NavButton} from "../Header/NavButton/NavButton.tsx";

export const Footer = () => (
    <header className="footer">
        <div className="footer-nav">
            <NavButton label="Github"/>
            <NavButton label="Imprint"/>
        </div>
    </header>
);
