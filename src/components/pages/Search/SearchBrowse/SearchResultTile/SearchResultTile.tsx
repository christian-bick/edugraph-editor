import './SearchResultTile.scss'
import {type SearchResult, useSearchStore} from "../../../../../stores/search.ts";

interface SearchResultTileProps {
    result: SearchResult
}

export const SearchResultTile = ({result}: SearchResultTileProps) => {
    const setSelectedResult = useSearchStore(state => state.setSelectedResult)
    const setHighlightedResult = useSearchStore(state => state.setHighlightedResult)

    return (
        <div className="search-result"
             onClick={() => setSelectedResult(result)}
             onMouseEnter={() => setHighlightedResult(result)}
             onMouseLeave={() => setHighlightedResult(null)}
        >
            <div className="search-result-content">
                <img src={result.questionImage} alt="Search Result"/>
            </div>
        </div>
    )
}
