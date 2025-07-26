import './SearchBrowse.css'
import React from 'react';
import {SectionHeader} from "../../../global/SectionHeader/SectionHeader.tsx";

export const SearchBrowse = () => ([
    <div className="search-browse">
        <SectionHeader>
            Search
        </SectionHeader>
    </div>,
    <div className="search-filter">
        <SectionHeader>
            Meta
        </SectionHeader>
    </div>
])