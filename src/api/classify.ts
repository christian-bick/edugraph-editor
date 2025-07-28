import {ENDPOINT} from "./enpoint.ts";

const CLASSIFY_URL = `${ENDPOINT}/classify`

export const classifyFile = (file) => {
    const name = file.name;
    let formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);

    return fetch(CLASSIFY_URL, {
        method: 'POST',
        body: formData
    }).then(response => response.json())
}
