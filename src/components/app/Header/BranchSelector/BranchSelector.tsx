import {useEffect, useRef, useState} from 'react';
import {useBranchStore} from '../../../../stores/branch-store.ts';
import './BranchSelector.scss';
import clsx from "clsx";
import {useFocusStore} from "../../../../stores/focus-store.ts";
import {useSelectedEntityStore} from "../../../../stores/selected-entity-store.ts";

export const BranchSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { branches, activeBranch, setActiveBranch } = useBranchStore();
    const { setFocus } = useFocusStore();
    const { setSelectedEntityIri } = useSelectedEntityStore();
    const selectorRef = useRef<HTMLDivElement>(null);


    const handleSelect = (branch: string) => {
        setActiveBranch(branch);
        setFocus('global');
        setSelectedEntityIri(null);
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
        <div className="branch-selector custom-selector" ref={selectorRef}>
            <div className="custom-selector__active" onClick={() => setIsOpen(!isOpen)}>
                <span>{activeBranch}</span>
                <i className={clsx('arrow', isOpen ? 'up' : 'down')}></i>
            </div>
            {isOpen && (
                <ul className="custom-selector__list">
                    {branches.map((branch) => (
                        <li
                            key={branch}
                            className={clsx('custom-selector__item', branch === activeBranch && 'selected')}
                            onClick={() => handleSelect(branch)}
                        >
                            {branch}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
