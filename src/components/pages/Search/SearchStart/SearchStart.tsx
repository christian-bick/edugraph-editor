import './SearchStart.scss'
import React, {useState} from 'react';
import {classifyAndSearchFile} from '../../../../api/classify'
import icon_photo from '../../../../assets/icons/add_photo_c1.svg'
import icon_upload from '../../../../assets/icons/upload_c2.svg'
import {useSearchStore} from "../../../../stores/search.ts";
import {useNavigate} from "react-router";

export const SearchStart = () => {

    const [waiting, setWaiting] = useState<boolean>(false);
    const [error, setError] = useState<string>(null)

    const setInput = useSearchStore((state) => state.setInput)
    const setResults = useSearchStore((state) => state.setResults)
    const setClassification = useSearchStore((state) => state.setClassification)
    const navigate = useNavigate()
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0 && typeof files[0] !== 'undefined') {
            const file = files[0]
            setInput({name: file.name, file: file})
            setWaiting(true);
            try {
                const response = await classifyAndSearchFile(file)
                if (response.error) {
                    console.log(response.error)
                    setError(response.error)
                } else {
                    setClassification(response.classification)
                    setResults(response.neighbors)
                    navigate("/search")
                }
            } catch (err) {
                console.log(err)
                setError(err.message)
            } finally {
                setWaiting(false)
            }
        }
    };


    return (
        <div className="search-start">
            <div className="search-prompt">
                Share an Example
            </div>
            <div className="search-form">
                {!waiting ? (
                    <label htmlFor="upload-input">
                        <img src={icon_photo} alt="Photo"/>
                        <img src={icon_upload} alt="Scan"/>
                    </label>
                ) : (
                    <div className="loader"></div>
                )}
                <input id="upload-input" type="file" accept="image/*" capture="environment"
                       onChange={handleFileChange}/>
            </div>
            <div className="search-prompt">
                {!error ? (
                    <span>to find similar</span>
                ) : (
                    <span className="error">Search failed: {truncateString(error, 40)}</span>
                )}
            </div>
        </div>
    )
}

function truncateString(str, maxLength) {
    if (!str) {
        return "Unknown reason"
    }
    if (str.length <= maxLength) {
        return str;
    }
    return str.slice(0, maxLength-3) + '...';
}
