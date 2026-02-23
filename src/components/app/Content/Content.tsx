import {type ReactNode} from 'react';

import './Content.scss';

export const Content = (props: { children: ReactNode }) => (
    <div className="content">
        {props.children}
    </div>
)