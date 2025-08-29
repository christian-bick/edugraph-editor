import './SearchBrowse.scss'
import React, {useEffect, useState} from 'react';
import input_icon from '../../../../assets/icons/add_photo.svg'
import {SectionHeader} from '../../../global/SectionHeader/SectionHeader.tsx';
import {SearchFilter} from '../SearchFilter/SearchFilter.tsx';
import {SearchResultTile} from "./SearchResultTile/SearchResultTile.tsx";
import {useSearchStore} from "../../../../stores/search.ts";
import {Link} from "react-router";

export const SearchBrowse = () => {

    const results = useSearchStore(state => state.results)
    const input = useSearchStore(state => state.input)

    const [inputContent, setInputContent] = useState<string | ArrayBuffer>(null);

    useEffect(() => {
        const reader = new FileReader();

        // Resolve the promise with the result when the reader has successfully loaded the file
        reader.onload = (event) => {
            setInputContent(event.target.result);
        };

        // Reject the promise if there's an error
        reader.onerror = (error) => {
            console.log(error);
        };

        // Start reading the file
        reader.readAsDataURL(input.file);
    }, [input])

    return (
        <>
            <div className="search-browse">
                <SectionHeader>
                    Search
                </SectionHeader>
                <div className="search-input">
                    <div className="input-icon">
                        <img src={inputContent} alt="Input Icon"/>
                    </div>
                    <div className="input-description">

                    </div>
                    <div className="input-upload">
                        <Link to="/">
                            <img src={input_icon} alt="Input Icon"/>
                        </Link>
                    </div>
                </div>
                <div className="search-result-list">
                    {results.map(result => <SearchResultTile
                        key={result.contentHash}
                        result={result}
                    />)
                    }
                </div>
            </div>
            <SearchFilter/>
        </>)
}
