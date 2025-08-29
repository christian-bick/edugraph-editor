import './SearchFilter.scss'
import React from 'react';
import {SectionHeader} from "../../../global/SectionHeader/SectionHeader.tsx";
import {DimensionFilter} from "./DimensionFilter/DimensionFilter.tsx";
import {useSearchStore} from "../../../../stores/search.ts";

export const SearchFilter = () => {
    const classification  = useSearchStore(state => state.classification)

    return (
        <div className="search-filter">
            <div className="filter-section">
                <SectionHeader>Area</SectionHeader>
                {classification.Area.map(label => <DimensionFilter
                    key={label}
                    dimension="1"
                    label={uriToLabel(label)}
                />)
                }
            </div>
            <div className="filter-section">
                <SectionHeader>Ability</SectionHeader>
                {classification.Ability.map(label => <DimensionFilter
                    key={label}
                    dimension="2"
                    label={uriToLabel(label)}
                />)
                }
            </div>
            <div className="filter-section">
                <SectionHeader>Scope</SectionHeader>
                {classification.Scope.map(label => <DimensionFilter
                    key={label}
                    dimension="3"
                    label={uriToLabel(label)}
                />)
                }
            </div>
        </div>
    )
}

function uriToLabel(uri) {
    // 1. Get the part of the string after the '#' symbol.
    const fragment = uri.split('#').pop() || '';
    // 2. Add a space before each uppercase letter
    return fragment.replace(/([A-Z])/g, ' $1').trim();
}
