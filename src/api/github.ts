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
    const cacheBuster = `t=${new Date().getTime()}`;
    // First, correctly append the cache buster to the actual API URL
    const urlWithCacheBust = url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;

    // Then, prepend the proxy to the final, correct URL
    const finalUrl = `${PROXY_URL}${urlWithCacheBust}`;

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

export const loadOntologyFile = async (file: string, branch = 'main'): Promise<string> => {
    const url = `${GITHUB_API_HOST}/repos/${REPO_NAME}/contents/${file}?ref=${branch}`;
    const response = await apiGet(url, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to load ontology file ${file}: ${response.statusText}`);
    }

    const fileData = await response.json();

    // The GitHub API returns file content as a base64 encoded string. We need to decode it.
    if (fileData && fileData.content) {
        return atob(fileData.content);
    } else {
        throw new Error(`Ontology file content not found for ${file}.`);
    }
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
