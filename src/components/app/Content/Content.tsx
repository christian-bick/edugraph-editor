import {type ReactNode} from 'react';

import './Content.scss';

export const Content = (props: { children: ReactNode }) => (
    <div className="content">
        <div className="content-grid">
            {props.children}
        </div>
    </div>
)