import './DimensionFilter.scss'
import {useSearchStore, SearchFunction} from "../../../../../stores/search.ts";
import {useOntologyStore, type Ontology, type OntologyEntity, type OntologyEntities} from "../../../../../stores/ontology.ts";
import plusIcon from "../../../../../assets/icons/plus.svg";
import minusIcon from "../../../../../assets/icons/minus.svg";
import {useState} from "react";

export interface DimensionFilterProps {
    dimension: number
    label: string
    entityName: string
    category: keyof OntologyEntities
    highlight: boolean
    lowlight: boolean
}

interface ResolvedEntity {
    key: string;
    name: string;
}

const resolveNames = (keys: string[], ontology: Ontology | null): ResolvedEntity[] => {
    if (!ontology || !keys.length) return [];

    // Helper to find natural name in a specific category or all
    const findNaturalName = (key: string): ResolvedEntity => {
        for (const category of Object.values(ontology.entities)) {
            const found = category.find((e: OntologyEntity) => e.name === key);
            if (found) return { key, name: found.natural_name };
        }
        return { key, name: key };
    };

    return keys.map(findNaturalName);
};


export const DimensionFilter = ({dimension, label, entityName, category, highlight, lowlight}: DimensionFilterProps) => {
    const selectedFunction = useSearchStore(state => state.selectedFunction)
    const selectedResult = useSearchStore(state => state.selectedResult)
    const search = useSearchStore(state => state.search)
    const setSearch = useSearchStore(state => state.setSearch)
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
    let extendsList: ResolvedEntity[] = [];
    let extendedByList: ResolvedEntity[] = [];

    if (selectedFunction === SearchFunction.Similarity && ontology?.relations && !selectedResult) {
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

    const handleSelectEntity = (newKey: string) => {
        // 1. Find the current full URI in the search state for this category that matches the current entityName
        // We assume the URI ends with `#${entityName}`
        const currentUris = search[category];
        const currentUriIndex = currentUris.findIndex(uri => uri.endsWith(`#${entityName}`));

        if (currentUriIndex !== -1) {
            const currentUri = currentUris[currentUriIndex];
            // 2. Construct the new URI by replacing the suffix
            // This assumes the prefix is consistent.
            const prefix = currentUri.substring(0, currentUri.lastIndexOf('#') + 1);
            const newUri = `${prefix}${newKey}`;

            // 3. Update the search state
            const newUris = [...currentUris];
            newUris[currentUriIndex] = newUri;

            setSearch({
                ...search,
                [category]: newUris
            });

            closeList();
        } else {
            console.warn(`Could not find URI for entity ${entityName} in category ${category}`);
        }
    };

    return (
        <div className={`dimension-filter ${dimensionClass} ${emphasizeClass} ${openList ? 'has-open-list' : ''}`}>
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
                    {extendsList.map(item => (
                        <div key={item.key} className="relation-item" onClick={() => handleSelectEntity(item.key)}>
                            {item.name}
                        </div>
                    ))}
                </div>
            )}
            {openList === 'extendedBy' && (
                <div className="relation-list mode-extendedBy">
                    {extendedByList.map(item => (
                        <div key={item.key} className="relation-item" onClick={() => handleSelectEntity(item.key)}>
                            {item.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}




