import './SearchBrowse.scss'
import React from 'react';
import input_icon from '../../../../assets/icons/add_photo.svg'
import {SectionHeader} from '../../../global/SectionHeader/SectionHeader.tsx';
import {SearchFilter} from '../SearchFilter/SearchFilter.tsx';
import {SearchResultTile} from "./SearchResultTile/SearchResultTile.tsx";
import {useSearchStore} from "../../../../stores/search.ts";

export const SearchBrowse = () => {

    const results = useSearchStore(state => state.results)

    return ([
        <div className="search-browse">
            <SectionHeader>
                Search
            </SectionHeader>
            <div className="search-input">
                <div className="input-icon">
                    <img src={input_icon} alt="Input Icon"/>
                </div>
                <div className="input-description">

                </div>
                <div className="input-upload">
                    <img src={input_icon} alt="Input Icon"/>
                </div>
            </div>
            <div className="search-result-list">
                {results.map(result => <SearchResultTile {...result.content}/>)}
            </div>
        </div>,
        <SearchFilter/>
    ])
}
