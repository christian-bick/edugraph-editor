const GENERATE_DEFINITION_PROMPT = `You are an expert in competency ontologies for primary & secondary school education.
Your task is to provide a concise and precise definition for a given term within the ontology.
The definition should be strictly text, without any conversational filler, preambles, or postambles.
Crucially, mirror the language, technical vocabulary, and stylistic tone of the provided parent and sibling
definitions to ensure the new definition fits seamlessly into the existing context.`;

const ONTOLOGY_CHAT_SYSTEM_INSTRUCTION = `You are an expert in competency ontologies for primary & secondary school
education, specifically working with Turtle (TTL) files for competency frameworks.
Your task is to help the user modify an existing Turtle file by first discussing a plan.

Analyze the user's request against the provided ontology and schema context.
Propose a clear, step-by-step plan for the changes. Do not output the Turtle file yet.
Engage in a conversation to refine this plan until the user is satisfied.
`;

const ONTOLOGY_EXECUTION_SYSTEM_INSTRUCTION = `Now, based on the agreed plan, provide the modified Turtle file content.

CRITICAL RULES:
1. Output ONLY the valid Turtle file content. No conversation, no markdown blocks, no preambles.
2. Maintain the existing prefixes and structure.
3. Ensure the output is valid Turtle that can be parsed by standard RDF tools.
4. Only modify what is requested, but ensure the resulting ontology remains consistent.
5. Use the same IRIs and naming conventions as in the provided file.
`;

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const verifyGeminiToken = async (token: string): Promise<boolean> => {
    if (!token) return false;
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${token}`);
        return response.ok;
    } catch (error) {
        console.error("Gemini token verification failed:", error);
        return false;
    }
};

export const generateDefinition = async (
    token: string,
    term: string,
    context: {
        parent?: { name: string; definition: string };
        siblings?: { name: string; definition: string }[];
        existingDefinition?: string;
    }
): Promise<string> => {
    if (!token) throw new Error("Gemini API token is missing.");

    let userPrompt = `Term to define: "${term}"\n\n`;

    if (context.existingDefinition) {
        userPrompt += `Existing Definition (to be refined): "${context.existingDefinition}"\n\n`;
    }

    if (context.parent) {
        userPrompt += `Context (Parent): The term "${term}" is a sub-competency of "${context.parent.name}".\n`;
        userPrompt += `Parent Definition: "${context.parent.definition}"\n\n`;
    }

    if (context.siblings && context.siblings.length > 0) {
        userPrompt += `Context (Siblings): Other competencies at the same level as "${term}" include:\n`;
        context.siblings.forEach(sibling => {
            userPrompt += `- ${sibling.name}: ${sibling.definition}\n`;
        });
        userPrompt += `\n`;
    }

    if (context.existingDefinition) {
        userPrompt += `Provide an improved definition for "${term}" using the existing definition as a base, while adopting the wording and style of the context above.`;
    } else {
        userPrompt += `Provide a definition for "${term}" that adopts the wording and style of the context above.`;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `${GENERATE_DEFINITION_PROMPT}\n\n${userPrompt}` }]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 2048,
                    thinkingConfig: {
                        thinkingLevel: 'medium',
                    },
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Failed to generate definition.");
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content;
        const result = content?.parts
            ?.map((part: any) => part.text)
            .filter((text: string) => !!text)
            .join('');

        if (!result) throw new Error("No definition generated.");

        return result.trim();
    } catch (error) {
        console.error("Gemini generation failed:", error);
        throw error;
    }
};

const callGemini = async (token: string, model: string, history: ChatMessage[], thinkingLevel: 'medium' | 'high' = 'high') => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${token}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: history,
            generationConfig: {
                temperature: history.length > 1 ? 0.7 : 0.1, // More creative in chat, precise in first prompt
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 16384,
                thinkingConfig: {
                    thinkingLevel,
                },
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API error (${response.status}).`);
    }

    return await response.json();
};

export const startOntologyChat = async (
    token: string,
    userPrompt: string,
    currentFileContent: string,
    schemaContext?: string | null,
    onThought?: (thought: string) => void
): Promise<{ response: string; history: ChatMessage[] }> => {
    if (!token) throw new Error("Gemini API token is missing.");

    let systemContext = `SYSTEM INSTRUCTION:\n${ONTOLOGY_CHAT_SYSTEM_INSTRUCTION}\n\n`;
    if (schemaContext) {
        systemContext += `CORE SCHEMA CONTEXT:\n${schemaContext}\n\n`;
    }
    systemContext += `CURRENT FILE CONTENT:\n${currentFileContent}\n\nUSER REQUEST: ${userPrompt}`;

    const history: ChatMessage[] = [
        {
            role: 'user',
            parts: [{ text: systemContext }]
        }
    ];

    const data = await callGemini(token, 'gemini-3.1-pro-preview', history);
    const candidate = data.candidates?.[0];

    if (candidate?.thought) {
        onThought?.(candidate.thought);
    }

    const result = candidate?.content?.parts
        ?.map((part: any) => part.text)
        .filter((text: string) => !!text)
        .join('')
        .trim();

    if (!result) throw new Error("No response generated.");

    history.push({
        role: 'model',
        parts: [{ text: result }]
    });

    return { response: result, history };
};

export const continueOntologyChat = async (
    token: string,
    userMessage: string,
    history: ChatMessage[],
    onThought?: (thought: string) => void
): Promise<{ response: string; history: ChatMessage[] }> => {
    const updatedHistory: ChatMessage[] = [
        ...history,
        {
            role: 'user',
            parts: [{ text: userMessage }]
        }
    ];

    const data = await callGemini(token, 'gemini-3.1-pro-preview', updatedHistory);
    const candidate = data.candidates?.[0];

    if (candidate?.thought) {
        onThought?.(candidate.thought);
    }

    const result = candidate?.content?.parts
        ?.map((part: any) => part.text)
        .filter((text: string) => !!text)
        .join('')
        .trim();

    if (!result) throw new Error("No response generated.");

    updatedHistory.push({
        role: 'model',
        parts: [{ text: result }]
    });

    return { response: result, history: updatedHistory };
};

export const executeOntologyModification = async (
    token: string,
    history: ChatMessage[],
    onProgress?: (message: string) => void,
    onThought?: (thought: string) => void
): Promise<string> => {
    const executionHistory: ChatMessage[] = [
        ...history,
        {
            role: 'user',
            parts: [{ text: ONTOLOGY_EXECUTION_SYSTEM_INSTRUCTION }]
        }
    ];

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        onProgress?.(attempts === 1 ? "Generating modification..." : `Parsing failed. Retry attempt ${attempts - 1}/2...`);

        try {
            const data = await callGemini(token, 'gemini-3.1-pro-preview', executionHistory, 'high');
            const candidate = data.candidates?.[0];

            if (candidate?.thought) {
                onThought?.(candidate.thought);
                console.log("Gemini Thought Process:", candidate.thought);
            }

            const result = candidate?.content?.parts
                ?.map((part: any) => part.text)
                .filter((text: string) => !!text)
                .join('')
                .trim();

            if (!result) throw new Error("No content generated.");

            const turtleMatch = result.match(/```(?:turtle|ttl)?\s*([\s\S]*?)```/) || [null, result];
            const cleanedResult = turtleMatch[1]?.trim();

            if (!cleanedResult || (!cleanedResult.includes('@prefix') && !cleanedResult.includes('<http'))) {
                throw new Error("Generated content does not appear to be valid Turtle.");
            }

            return cleanedResult;

        } catch (error: any) {
            console.warn(`Attempt ${attempts} failed:`, error);
            if (attempts >= maxAttempts) throw error;

            executionHistory.push({
                role: 'model',
                parts: [{ text: "Error in generating or parsing output." }]
            });
            executionHistory.push({
                role: 'user',
                parts: [{ text: `The previous output was invalid or could not be parsed as Turtle. Error: ${error.message}. Please try again and ensure you output ONLY valid Turtle content without any markdown formatting or preambles.` }]
            });
        }
    }

    throw new Error("Failed to generate a valid ontology modification after retries.");
};
