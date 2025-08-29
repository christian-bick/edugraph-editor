import './SearchFilter.scss'
import React from 'react';
import {SectionHeader} from "../../../global/SectionHeader/SectionHeader.tsx";
import {DimensionFilter} from "./DimensionFilter/DimensionFilter.tsx";

export const SearchFilter = () => {
    const []

    return (
        <div className="search-filter">
            <div className="filter-section">
                <SectionHeader>Area</SectionHeader>
                <DimensionFilter dimension="1" label="Addition"/>
            </div>
        </div>
    )
}
