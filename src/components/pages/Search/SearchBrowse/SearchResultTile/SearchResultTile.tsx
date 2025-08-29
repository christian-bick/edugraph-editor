import './SearchResultTile.scss'
import React from 'react';
import {SearchResult, useSearchStore} from "../../../../../stores/search.ts";

interface SearchResultTileProps {
    result: SearchResult
}

export const SearchResultTile = ({ result }: SearchResultTileProps) => {
    const setHighlightedResult = useSearchStore(state => state.setHighlightedResult)

    return (
        <div className="search-result" onMouseEnter={() => setHighlightedResult(result)}>
            <a href={result.questionDoc} target="_blank">
                <img src={result.questionImage} alt="Search Result"/>
            </a>
        </div>
    )
}
