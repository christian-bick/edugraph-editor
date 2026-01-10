import {ENDPOINT} from "./enpoint.ts";

const ONTOLOGY_URL = `${ENDPOINT}/ontology`

export const loadOntology = () => {
    return fetch(ONTOLOGY_URL, {
        method: 'GET',
    }).then(response => response.json())
}
