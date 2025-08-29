import './SearchStart.scss'
import React, {useState} from 'react';
import {classifyAndSearchFile} from '../../../../api/classify'
import icon_photo from '../../../../assets/icons/take_photo.svg'
import icon_upload from '../../../../assets/icons/upload.svg'
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
                console.log(response)
                setClassification(response.classification)
                setResults(response.neighbors)
                navigate("/search")
            } catch (err) {
                setError(err)
            } finally {
                setWaiting(false)
            }
        }
    };


    return (
        <div className="search-start">
            <div className="search-prompt">
                Share Example
            </div>
            <div className="search-form">
                <label htmlFor="upload-input">
                    <img src={icon_photo} alt="Photo"/>
                    <img src={icon_upload} alt="Scan"/>
                </label>
                <input id="upload-input" type="file" accept="image/*" capture="environment"
                       onChange={handleFileChange}/>
            </div>
            <div className="search-prompt">
                to find similar
            </div>
        </div>
    )
}
