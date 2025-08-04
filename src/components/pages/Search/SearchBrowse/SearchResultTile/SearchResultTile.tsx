import './SearchResultTile.scss'
import React from 'react';

interface SearchResultTileProps {
    preview: string,
    original: string
}

export const SearchResultTile = (props: SearchResultTileProps) => (
    <div className="search-result">
        <a href={props.original} target="_blank">
            <img src={props.preview} alt="Search Result" />
        </a>
    </div>
)
