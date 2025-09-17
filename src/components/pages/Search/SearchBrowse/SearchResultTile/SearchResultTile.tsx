import './SearchResultTile.scss'
import {type SearchResult, useSearchStore} from "../../../../../stores/search.ts";

interface SearchResultTileProps {
    result: SearchResult
}

export const SearchResultTile = ({result}: SearchResultTileProps) => {
    const setSelectedResult = useSearchStore(state => state.setSelectedResult)

    return (
        <div className="search-result"
             onClick={() => setSelectedResult(result)}
        >
            <div className="search-result-content">
                <img src={result.questionImage} alt="Search Result"/>
            </div>
        </div>
    )
}
