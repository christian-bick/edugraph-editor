

import './Footer.scss';
import {NavButton} from "../Header/NavButton/NavButton.tsx";

export const Footer = () => (
    <header className="footer">
        <div className="footer-nav">
            <a href="https://github.com/christian-bick/edugraph-ontology">Ontology</a>
            <a href="https://github.com/christian-bick/edugraph-classify-qwen3vl">Classification Model</a>
            <a href="https://github.com/christian-bick/edugraph-embed">Embedding Model</a>
        </div>
    </header>
);
