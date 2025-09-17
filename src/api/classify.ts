import {ENDPOINT} from "./enpoint.ts";

const CLASSIFY_AND_SEARCH_URL = `${ENDPOINT}/classify_and_search`
export const classifyAndSearchFile = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(CLASSIFY_AND_SEARCH_URL, {
        method: 'POST',
        body: formData
    }).then(response => response.json())
}
