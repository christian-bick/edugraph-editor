import React from 'react';

import './Content.scss';

export const Content = (props) => (
    <div className="content">
        <div className="content-grid">
            {props.children}
        </div>
    </div>
)