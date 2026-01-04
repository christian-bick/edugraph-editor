import './SearchBrowse.scss'
import input_icon from '../../../../assets/icons/add_photo.svg'
import {SearchFilter} from '../SearchFilter/SearchFilter.tsx';
import {SearchResultTile} from "./SearchResultTile/SearchResultTile.tsx";
import {useSearchStore, SearchFunction} from "../../../../stores/search.ts";
import {Link} from "react-router-dom";
import {SearchResultDetail} from "./SearchResultDetail/SearchResultDetail.tsx";
import {SearchInputDetail} from "./SearchResultDetail/SearchInputDetail.tsx";

function SearchResultBody() {
    const results = useSearchStore(state => state.results)
    const selectedResult = useSearchStore(state => state.selectedResult)

    return <>
        {!selectedResult ? (
            <div className="search-result-list">
                {results.map(
                    result => <SearchResultTile key={result.contentHash} result={result}/>
                )}
            </div>
        ) : (
            <SearchResultDetail result={selectedResult}/>
        )}
    </>;
}

export const SearchBrowse = () => {

    const selectedFunction = useSearchStore(state => state.selectedFunction)
    const selectFunction = useSearchStore(state => state.setSelectedFunction)

    const similarClass = selectedFunction === SearchFunction.Similarity ? "active" : "inactive"
    const classifyClass = selectedFunction === SearchFunction.Classification ? "active" : "inactive"

    return (
        <>
            <div className="search-input">
                <div className="input-upload">
                    <Link to="/">
                        <img src={input_icon as string} alt="Input Icon"/>
                    </Link>
                </div>
                <div className="input-action">
                    <div className={`action-item ${classifyClass}`}
                         onClick={() => selectFunction(SearchFunction.Classification)}>
                        Classify
                    </div>
                    <div className={`action-item ${similarClass}`}
                         onClick={() => selectFunction(SearchFunction.Similarity)}>
                        Find Similar
                    </div>
                </div>
            </div>
            <div className="search-browse">

                {selectedFunction === SearchFunction.Similarity ?
                    <SearchResultBody/> :
                    <SearchInputDetail/>
                }
            </div>
            <SearchFilter/>
        </>)
}
