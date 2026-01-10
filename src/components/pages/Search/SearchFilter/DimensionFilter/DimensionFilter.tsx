import './DimensionFilter.scss'
import {useSearchStore, SearchFunction} from "../../../../../stores/search.ts";
import {useOntologyStore} from "../../../../../stores/ontology.ts";
import plusIcon from "../../../../../assets/icons/plus.svg";
import minusIcon from "../../../../../assets/icons/minus.svg";

export interface DimensionFilterProps {
    dimension: number
    label: string
    entityName: string
    highlight: boolean
    lowlight: boolean
}

export const DimensionFilter = ({dimension, label, entityName, highlight, lowlight}: DimensionFilterProps) => {
    const selectedFunction = useSearchStore(state => state.selectedFunction)
    const ontology = useOntologyStore(state => state.ontology)

    const dimensionClass = "dimension-" + dimension

    let emphasizeClass = ""
    if (highlight) {
        emphasizeClass = "highlight"
    } else if (lowlight) {
        emphasizeClass = "lowlight"
    }

    let hasExtends = false;
    let hasExtendedBy = false;

    if (selectedFunction === SearchFunction.Similarity && ontology?.relations) {
        hasExtends = (ontology.relations.expands?.[entityName]?.length ?? 0) > 0;
        hasExtendedBy = (ontology.relations.expandedBy?.[entityName]?.length ?? 0) > 0;
    }

    return (
        <div className={`dimension-filter ${dimensionClass} ${emphasizeClass}`}>
            <div className="indicator-container">
                {hasExtends && <div className="indicator"><img src={minusIcon} alt="minus"/></div>}
            </div>
            <div className="label-container">
                {label}
            </div>
            <div className="indicator-container">
                {hasExtendedBy && <div className="indicator"><img src={plusIcon} alt="plus"/></div>}
            </div>
        </div>
    )
}


