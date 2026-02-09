import './SearchStart.scss'
import {useState} from 'react';
import {classifyAndSearchFile} from '../../../../api/classify'
import icon_photo from '../../../../assets/icons/upload_c2.svg'
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
    const processFile = (file: File) => {
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0 && typeof files[0] !== 'undefined') {
            processFile(files[0])
        }
    };

    const handleExampleClick = async () => {
        const examplePath = EXAMPLES[currentExampleIndex];
        try {
            setWaiting(true); // Show loading immediately
            const response = await fetch(examplePath);
            const blob = await response.blob();
            // Create a File object from the Blob
            const file = new File([blob], examplePath.split('/').pop() || 'example.jpg', { type: blob.type });
            processFile(file);
        } catch (err: any) {
            console.error("Failed to load example:", err);
            setError("Failed to load example image.");
            setWaiting(false);
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
                Classify K-4 Math Content
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
            <div className="search-prompt" style={{visibility: waiting ? 'hidden' : 'visible'}}>
                {!error ? (
                    <span>&nbsp;</span>
                ) : (
                    <span className="error">Search failed: {truncateString(error, 100)}</span>
                )}
            </div>
            <div className="search-prompt" style={{visibility: waiting ? 'hidden' : 'visible'}}>
                or use an example
            </div>
            <div className="example-carousel" style={{visibility: waiting ? 'hidden' : 'visible'}}>
                <button className="nav-btn prev" onClick={prevExample}></button>
                <img
                    src={EXAMPLES[currentExampleIndex]}
                    alt={`Example ${currentExampleIndex + 1}`}
                    className="example-image"
                    onClick={handleExampleClick}
                    style={{cursor: 'pointer'}}
                />
                <button className="nav-btn next" onClick={nextExample}></button>
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

