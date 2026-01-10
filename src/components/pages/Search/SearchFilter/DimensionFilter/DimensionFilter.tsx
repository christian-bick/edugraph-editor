import './DimensionFilter.scss'
import {useSearchStore, SearchFunction} from "../../../../../stores/search.ts";
import {useOntologyStore, type Ontology, type OntologyEntity} from "../../../../../stores/ontology.ts";
import plusIcon from "../../../../../assets/icons/plus.svg";
import minusIcon from "../../../../../assets/icons/minus.svg";
import {useState} from "react";

export interface DimensionFilterProps {
    dimension: number
    label: string
    entityName: string
    highlight: boolean
    lowlight: boolean
}

const resolveNames = (keys: string[], ontology: Ontology | null): string[] => {
    if (!ontology || !keys.length) return [];
    
    // Helper to find natural name in a specific category or all
    const findNaturalName = (key: string) => {
        // Try the same category first if we know it (we don't strictly know it here unless passed, 
        // but looking through all is safer as relations might cross dimensions? 
        // Typically they don't in this specific ontology, but safer to check.)
        
        for (const category of Object.values(ontology.entities)) {
            const found = category.find((e: OntologyEntity) => e.name === key);
            if (found) return found.natural_name;
        }
        return key; // Fallback to key
    };

    return keys.map(findNaturalName);
};


export const DimensionFilter = ({dimension, label, entityName, highlight, lowlight}: DimensionFilterProps) => {
    const selectedFunction = useSearchStore(state => state.selectedFunction)
    const ontology = useOntologyStore(state => state.ontology)
    const [openList, setOpenList] = useState<'extends' | 'extendedBy' | null>(null);

    const dimensionClass = "dimension-" + dimension

    let emphasizeClass = ""
    if (highlight) {
        emphasizeClass = "highlight"
    } else if (lowlight) {
        emphasizeClass = "lowlight"
    }

    let hasExtends = false;
    let hasExtendedBy = false;
    let extendsList: string[] = [];
    let extendedByList: string[] = [];

    if (selectedFunction === SearchFunction.Similarity && ontology?.relations) {
        const extendsKeys = ontology.relations.expands?.[entityName] || [];
        const extendedByKeys = ontology.relations.expandedBy?.[entityName] || [];
        
        hasExtends = extendsKeys.length > 0;
        hasExtendedBy = extendedByKeys.length > 0;
        
        if (openList === 'extends') {
            extendsList = resolveNames(extendsKeys, ontology);
        } else if (openList === 'extendedBy') {
            extendedByList = resolveNames(extendedByKeys, ontology);
        }
    }

    const toggleExtends = () => setOpenList(prev => prev === 'extends' ? null : 'extends');
    const toggleExtendedBy = () => setOpenList(prev => prev === 'extendedBy' ? null : 'extendedBy');
    const closeList = () => setOpenList(null);

    return (
        <div className={`dimension-filter ${dimensionClass} ${emphasizeClass}`}>
            <div className="filter-header">
                <div className="indicator-container" onClick={hasExtends ? toggleExtends : undefined}>
                    {hasExtends && <div className="indicator"><img src={minusIcon} alt="minus"/></div>}
                </div>
                <div className="label-container" onClick={closeList}>
                    {label}
                </div>
                <div className="indicator-container" onClick={hasExtendedBy ? toggleExtendedBy : undefined}>
                    {hasExtendedBy && <div className="indicator"><img src={plusIcon} alt="plus"/></div>}
                </div>
            </div>
            {openList === 'extends' && (
                <div className="relation-list mode-extends">
                    {extendsList.map(name => <div key={name} className="relation-item">{name}</div>)}
                </div>
            )}
            {openList === 'extendedBy' && (
                <div className="relation-list mode-extendedBy">
                    {extendedByList.map(name => <div key={name} className="relation-item">{name}</div>)}
                </div>
            )}
        </div>
    )
}



