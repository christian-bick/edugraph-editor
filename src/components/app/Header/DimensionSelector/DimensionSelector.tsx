import {useEffect, useRef, useState} from 'react';
import {useBranchStore} from '../../../../stores/branch-store.ts';
import './DimensionSelector.scss';
import clsx from "clsx";
import {useSelectedEntityStore} from "../../../../stores/selected-entity-store.ts";
import {useFocusStore} from "../../../../stores/focus-store.ts";

export const DimensionSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { activeDimension, setActiveDimension } = useBranchStore();
    const { setSelectedEntityIri } = useSelectedEntityStore();
    const { setFocus } = useFocusStore();
    const selectorRef = useRef<HTMLDivElement>(null);

    const dimensions = ['Area', 'Ability', 'Scope'];

    const handleSelect = (dimension: string) => {
        setActiveDimension(dimension);
        setSelectedEntityIri(null);
        setFocus('global');
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
        <div className="dimension-selector custom-selector" ref={selectorRef}>
            <div className="custom-selector__active" onClick={() => setIsOpen(!isOpen)}>
                <span>{activeDimension}</span>
                <i className={clsx('arrow', isOpen ? 'up' : 'down')}></i>
            </div>
            {isOpen && (
                <ul className="custom-selector__list">
                    {dimensions.map((dimension) => (
                        <li
                            key={dimension}
                            className={clsx('custom-selector__item', dimension === activeDimension && 'selected')}
                            onClick={() => handleSelect(dimension)}
                        >
                            {dimension}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
