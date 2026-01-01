import './SearchResultDetail.scss'
import {useSearchStore} from "../../../../../stores/search.ts";
import {useEffect, useState} from "react";

export const SearchInputDetail = () => {

    const input = useSearchStore(state => state.input)

    const [inputContent, setInputContent] = useState<string | ArrayBuffer>('');

    useEffect(() => {
        const reader = new FileReader();

        // Resolve the promise with the result when the reader has successfully loaded the file
        reader.onload = (event) => {
            if (event.target && event.target.result) {
                setInputContent(event.target.result);
            }
        };

        // Reject the promise if there's an error
        reader.onerror = (error) => {
            console.log(error);
        };

        // Start reading the file
        if (input) {
            reader.readAsDataURL(input.file);
        }
    }, [input])

    return (
        <div className="search-result-detail">
            <img className="preview-image" src={inputContent as string} alt="Search Input"/>
        </div>
    )
}
