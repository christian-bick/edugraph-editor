import './SearchStart.css'
import React from 'react';
import icon from '../../../../assets/icons/add_photo.svg'

export const SearchStart = () => (
    <div className="search-start">
        <div className="search-prompt">
            Find Similar
        </div>
        <div className="search-form">
            <label htmlFor="upload-input">
                <img src={icon} alt="Scan"/>
            </label>
            <input id="upload-input" type="file" accept="image/*" capture="environment"/>
        </div>
    </div>
)