import {type ReactNode} from "react";
import './SectionHeader.scss'

export const SectionHeader = (props: {children: ReactNode}) => (
    <div className="section-header">
        {props.children}
    </div>
)