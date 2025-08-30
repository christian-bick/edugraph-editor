import './SearchResultTile.scss'
import React from 'react';
import {SearchResult, useSearchStore} from "../../../../../stores/search.ts";

interface SearchResultTileProps {
    result: SearchResult
}

export const SearchResultTile = ({result}: SearchResultTileProps) => {
    const setHighlightedResult = useSearchStore(state => state.setHighlightedResult)
    const setSelectedResult = useSearchStore(state => state.setSelectedResult)

    return (
        <div className="search-result"
             onMouseEnter={() => setHighlightedResult(result)}
             onMouseLeave={() => setHighlightedResult(null)}
             onClick={() => setSelectedResult(result)}
        >
            <div className="search-result-content">
                <img src={result.questionImage} alt="Search Result"/>
            </div>
        </div>
    )
}
