import './SearchResultDetail.scss'
import React from 'react';
import {SearchResult, useSearchStore} from "../../../../../stores/search.ts";
import close from "../../../../../assets/icons/close.svg";

interface SearchResultDetailProps {
    result: SearchResult
}

export const SearchResultDetail = ({ result }: SearchResultDetailProps) => {
    const setSelectedResult = useSearchStore(state => state.setSelectedResult)

    return (
        <div className="search-result-detail">
            <img className="preview-image" src={result.questionImage} alt="Search Result"/>
            <img className="close-button" onClick={() => setSelectedResult(null)} src={close} alt="Photo"/>
        </div>
    )
}
