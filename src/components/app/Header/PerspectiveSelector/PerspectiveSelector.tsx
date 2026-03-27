import {useEffect, useRef, useState} from 'react';
import {useBranchStore} from '../../../../stores/branch-store.ts';
import './PerspectiveSelector.scss';
import clsx from "clsx";

export const PerspectiveSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { activePerspective, setActivePerspective } = useBranchStore();
    const selectorRef = useRef<HTMLDivElement>(null);

    const perspectives = ['Taxonomy', 'Understanding', 'Application', 'Progression' ];

    const handleSelect = (perspective: string) => {
        setActivePerspective(perspective);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="perspective-selector custom-selector" ref={selectorRef}>
            <div className="custom-selector__active" onClick={() => setIsOpen(!isOpen)}>
                <span>{activePerspective}</span>
                <i className={clsx('arrow', isOpen ? 'up' : 'down')}></i>
            </div>
            {isOpen && (
                <ul className="custom-selector__list">
                    {perspectives.map((perspective) => (
                        <li
                            key={perspective}
                            className={clsx('custom-selector__item', perspective === activePerspective && 'selected')}
                            onClick={() => handleSelect(perspective)}
                        >
                            {perspective}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
