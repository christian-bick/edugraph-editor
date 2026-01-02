import './SearchResultDetail.scss'
import {useSearchStore} from "../../../../../stores/search.ts";
import {useEffect, useState} from "react";

export const SearchInputDetail = () => {

    const input = useSearchStore(state => state.input)

    return (
        <div className="search-result-detail">
            {input?.preview && (
                <img className="preview-image" src={input.preview} alt="Search Input"/>
            )}
        </div>
    )
}

