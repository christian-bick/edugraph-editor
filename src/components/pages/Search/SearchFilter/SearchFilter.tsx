import './SearchFilter.scss'
import React from 'react';
import {SectionHeader} from "../../../global/SectionHeader/SectionHeader.tsx";
import {MetaFilter} from "./MetaFilter/Metafilter.tsx";

export const SearchFilter = () => ([
    <div className="search-filter">
        <SectionHeader>Meta</SectionHeader>
        <MetaFilter />
        <SectionHeader>Area</SectionHeader>
    </div>
])