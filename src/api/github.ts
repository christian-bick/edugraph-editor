const PROXY_URL = 'https://corsproxy.io/?'
const GITHUB_HOST = 'https://github.com'
const GITHUB_API_HOST = 'https://api.github.com';
const REPO_NAME = 'christian-bick/edugraph-ontology'

export const loadOntology = (branch = 'main') => {
    return fetch(`${PROXY_URL}${GITHUB_HOST}/${REPO_NAME}/raw/refs/heads/${branch}/core-ontology.ttl`, {
        method: 'GET',
    }).then(response => response.text())
}

export const loadBranches = async (): Promise<string[]> => {
    const cacheBuster = `t=${new Date().getTime()}`;
    const url = `${PROXY_URL}${GITHUB_API_HOST}/repos/${REPO_NAME}/branches?${cacheBuster}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch branches: ${response.statusText}`);
    }
    const branches: { name: string }[] = await response.json();
    return branches.map(branch => branch.name);
}
