import './SearchStart.scss'
import {useState} from 'react';
import {classifyAndSearchFile} from '../../../../api/classify'
import icon_photo from '../../../../assets/icons/add_photo_c1.svg'
import icon_upload from '../../../../assets/icons/upload_c2.svg'
import {useSearchStore} from "../../../../stores/search.ts";
import {useNavigate} from "react-router";

const EXAMPLES = [
    '/examples/addition_01.jpg',
    '/examples/addition_02.jpg',
    '/examples/subtract_01.jpg',
    '/examples/subtract_02.jpg'
];

export const SearchStart = () => {

    const [waiting, setWaiting] = useState<boolean>(false);
    const [error, setError] = useState<string>('')
    const [currentExampleIndex, setCurrentExampleIndex] = useState(0);

    const setInput = useSearchStore(state => state.setInput)
    const setResults = useSearchStore(state => state.setResults)
    const setClassification = useSearchStore(state => state.setClassification)
    const navigate = useNavigate()
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0 && typeof files[0] !== 'undefined') {
            const file = files[0]

            const reader = new FileReader();
            reader.onload = async (event) => {
                const preview = event.target?.result as string;
                setInput({name: file.name, preview: preview})

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
                } catch (err: any) {
                    console.log(err)
                    setError(err.message)
                } finally {
                    setWaiting(false)
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const nextExample = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentExampleIndex((prev) => (prev + 1) % EXAMPLES.length);
    };

    const prevExample = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentExampleIndex((prev) => (prev - 1 + EXAMPLES.length) % EXAMPLES.length);
    };


    return (
        <div className="search-start">
            <div className="search-prompt">
                Classify Content
            </div>
            <div className="search-form">
                {!waiting ? (
                    <label htmlFor="upload-input">
                        <img src={icon_photo} alt="Photo"/>
                    </label>
                ) : (
                    <div className="loader"></div>
                )}
                <input id="upload-input" type="file" accept="image/*" capture="environment"
                       onChange={handleFileChange}/>
            </div>
            <div className="search-prompt">
                {!error ? (
                    <span>or use an example</span>
                ) : (
                    <span className="error">Search failed: {truncateString(error, 100)}</span>
                )}
            </div>
            <div className="example-carousel">
                <button className="nav-btn prev" onClick={prevExample}>&lt;</button>
                <img
                    src={EXAMPLES[currentExampleIndex]}
                    alt={`Example ${currentExampleIndex + 1}`}
                    className="example-image"
                />
                <button className="nav-btn next" onClick={nextExample}>&gt;</button>
            </div>
        </div>
    )
}

function truncateString(str: string, maxLength: number) {
    if (!str) {
        return "Unknown reason"
    }
    if (str.length <= maxLength) {
        return str;
    }
    return str.slice(0, maxLength-3) + '...';
}

