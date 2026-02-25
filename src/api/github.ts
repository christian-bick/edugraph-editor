const PROXY_URL = 'https://corsproxy.io/?'
const GITHUB_HOST = 'https://github.com'
const GITHUB_API_HOST = 'https://api.github.com';
const REPO_NAME = 'christian-bick/edugraph-ontology'

/**
 * A generalized GET helper that applies the proxy and cache-busting logic.
 * @param url The target URL (without the proxy).
 * @param options The fetch options.
 */
const apiGet = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const proxiedUrl = `${PROXY_URL}${url}`;
    const cacheBuster = `t=${new Date().getTime()}`;
    const finalUrl = url.includes('?') ? `${proxiedUrl}&${cacheBuster}` : `${proxiedUrl}?${cacheBuster}`;

    const newOptions: RequestInit = {
        ...options,
        method: 'GET', // Ensure method is GET
        headers: {
            ...options.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        }
    };

    return fetch(finalUrl, newOptions);
};

export const loadOntology = async (branch = 'main'): Promise<string> => {
    const url = `${GITHUB_HOST}/${REPO_NAME}/raw/refs/heads/${branch}/core-ontology.ttl`;
    const response = await apiGet(url);
    if (!response.ok) {
        throw new Error(`Failed to load ontology: ${response.statusText}`);
    }
    return response.text();
}

export const loadBranches = async (): Promise<string[]> => {
    const url = `${GITHUB_API_HOST}/repos/${REPO_NAME}/branches`;
    const response = await apiGet(url, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch branches: ${response.statusText}`);
    }
    const branches: { name: string }[] = await response.json();
    return branches.map(branch => branch.name);
}
