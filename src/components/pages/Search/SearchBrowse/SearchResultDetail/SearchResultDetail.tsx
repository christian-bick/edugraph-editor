import './SearchResultDetail.scss'
import React from 'react';
import {SearchResult, useSearchStore} from "../../../../../stores/search.ts";
import close from "../../../../../assets/icons/close.svg";
import download from "../../../../../assets/icons/download.svg";

interface SearchResultDetailProps {
    result: SearchResult
}

export const SearchResultDetail = ({result}: SearchResultDetailProps) => {
    const setSelectedResult = useSearchStore(state => state.setSelectedResult)

    return (
        <div className="search-result-detail">
            <img className="preview-image" src={result.questionImage} alt="Search Result"/>
            <div className="action-buttons">
                <a href={result.questionDoc} target="_blank">
                    <img src={download} alt="Download"/>
                </a>
                <img onClick={() => setSelectedResult(null)} src={close} alt="Close"/>
            </div>
        </div>
    )
}
