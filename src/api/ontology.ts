const ONTOLOGY_URL = `https://corsproxy.io/?https://github.com/christian-bick/edugraph-ontology/raw/refs/heads/main/core-ontology.ttl`

export const loadOntology = () => {
    return fetch(ONTOLOGY_URL, {
        method: 'GET',
    }).then(response => response.text())
}

