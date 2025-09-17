

import './NavButton.scss';
import clsx from "clsx";


export interface NavButtonProps {
    label: string
    active?: boolean
}

export const NavButton = ({ label, active = false }: NavButtonProps) => (
    <div className={ clsx("nav-button", active && "active") }>
        {label}
    </div>
)