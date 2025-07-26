import './SearchStart.css'
import React from 'react';
import icon_photo from '../../../../assets/icons/take_photo.svg'
import icon_upload from '../../../../assets/icons/upload.svg'

export const SearchStart = () => (
    <div className="search-start">
        <div className="search-prompt">
            Share Example
        </div>
        <div className="search-form">
            <label htmlFor="upload-input">
                <img src={icon_photo} alt="Photo"/>
                <img src={icon_upload} alt="Scan"/>
            </label>
            <input id="upload-input" type="file" accept="image/*" capture="environment"/>
        </div>
        <div className="search-prompt">
            to find similar
        </div>
    </div>
)