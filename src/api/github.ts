import {useAuthStore} from "../stores/auth-store.ts";
import {Octokit} from "@octokit/rest";

const USE_VITE_PROXY = true; // Set to false to call GitHub API directly
const REPO_OWNER = 'christian-bick';
const REPO_NAME = 'edugraph-ontology';

const getOctokit = (overrideToken?: string) => {
    const tokenToUse = overrideToken ?? useAuthStore.getState().token;

    const options: { auth?: string, baseUrl?: string } = { auth: tokenToUse };

    if (USE_VITE_PROXY) {
        // For Octokit, we need to provide the full base URL for the proxy during development.
        // Assuming the dev server runs on localhost:5173 (default for Vite).
        // In a real app, this should be handled by environment variables.
        options.baseUrl = '/github-api';
    }

    return new Octokit(options);
};

export const loadOntologyFile = async (file: string, branch = 'main'): Promise<string> => {
    const octokit = getOctokit();
    const response = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: file,
        ref: branch,
    });

    // Type guard to ensure we have a file response
    if (Array.isArray(response.data) || !('content' in response.data)) {
        throw new Error(`Could not retrieve file content for ${file}.`);
    }

    return fromBase64(response.data.content.replace(/\n/g, ''));
};

export const loadBranches = async (): Promise<string[]> => {
    const octokit = getOctokit();
    const response = await octokit.repos.listBranches({
        owner: REPO_OWNER,
        repo: REPO_NAME,
    });
    return response.data.map(branch => branch.name);
};

export const verifyToken = async (token: string): Promise<boolean> => {
    if (!token) return false;
    const octokit = getOctokit(token);
    try {
        const response = await octokit.repos.get({
            owner: REPO_OWNER,
            repo: REPO_NAME,
        });

        // A successful request with a valid token will include this header.
        return response.status === 200 && response.headers['x-accepted-github-permissions'] !== undefined;
    } catch (error) {
        console.error("Token verification failed:", error);
        return false;
    }
};

export interface OntologyFileResponse {
    content: string;
    sha: string;
}

export const loadOntologyFiles = async (files: string[], branch = 'main'): Promise<OntologyFileResponse[]> => {
    const token = useAuthStore.getState().token;
    const octokit = getOctokit();

    if (!token) {
        // Fallback to REST API for unauthenticated access (public repos only)
        // GraphQL API always requires a token.
        return Promise.all(files.map(async (file) => {
            const response = await octokit.repos.getContent({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                path: file,
                ref: branch,
            });

            if (Array.isArray(response.data) || !('content' in response.data)) {
                throw new Error(`Could not retrieve file content for ${file}.`);
            }

            return {
                content: fromBase64(response.data.content.replace(/\n/g, '')),
                sha: response.data.sha,
            };
        }));
    }

    const expressions = files.reduce((obj, file, index) => {
        obj[`expression${index}`] = `${branch}:${file}`;
        return obj;
    }, {} as Record<string, string>);

    const query = `
        query GetOntologyFiles(
            $owner: String!,
            $name: String!,
            ${files.map((_, index) => `$expression${index}: String!`).join(', ')}
        ) {
            repository(owner: $owner, name: $name) {
                ${files.map((_, index) => `
                    file${index}: object(expression: $expression${index}) {
                        ... on Blob {
                            text
                            oid
                        }
                    }
                `).join('\n')}
            }
        }
    `;

    const response: any = await octokit.graphql(query, {
        owner: REPO_OWNER,
        name: REPO_NAME,
        ...expressions,
    });

    if (!response || !response.repository) {
        throw new Error("Failed to load ontology: GraphQL response missing repository data. Ensure you are logged in or the repository is public.");
    }

    return files.map((_, index) => {
        const fileContent = response.repository[`file${index}`];
        if (fileContent && fileContent.text && fileContent.oid) {
            return {
                content: fileContent.text,
                sha: fileContent.oid,
            };
        }
        // Handle cases where a file might not be found
        throw new Error(`Content for file ${files[index]} not found in GraphQL response.`);
    });
};

export const getFileSha = async (filePath: string, branch = 'main'): Promise<string> => {
    const octokit = getOctokit();
    const response = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filePath,
        ref: branch,
    });

    if (Array.isArray(response.data) || !('sha' in response.data)) {
        throw new Error(`Could not retrieve file SHA for ${filePath}.`);
    }
    return response.data.sha;
};


export const pushOntologyFile = async (
    filePath: string,
    content: string, // Unencoded content
    branch: string,
    commitMessage: string,
    expectedSha: string,
): Promise<string> => {
    const octokit = getOctokit();

    const response = await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filePath,
        message: commitMessage,
        content: toBase64(content), // Content must be base64 encoded
        sha: expectedSha, // Required for safe updates
        branch: branch,
    });

    return response.data.commit.sha; // Return the SHA of the new commit
};

// Helpers to handle Unicode safely
const toBase64 = (str: string) => {
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString);
};

const fromBase64 = (base64: string) => {
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
};
