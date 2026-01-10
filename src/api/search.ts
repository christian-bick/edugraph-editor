import {ENDPOINT} from "./enpoint.ts";

const SEARCH_URL = `${ENDPOINT}/search`

export const searchEntities = async (entity_uris: string[]) => {
    return fetch(SEARCH_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entity_uris })
    }).then(response => response.json())
}
