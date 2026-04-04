const GENERATE_DEFINITION_PROMPT = `You are an expert in competency ontologies.
Your task is to provide a concise and precise definition for a given term within the ontology.
The definition should be strictly text, without any conversational filler, preambles, or postambles.
Crucially, mirror the language, technical vocabulary, and stylistic tone of the provided parent and sibling
definitions to ensure the new definition fits seamlessly into the existing context.`;

const ONTOLOGY_PROMPT_SYSTEM_INSTRUCTION = `You are an expert in competency ontologies, specifically working with Turtle (TTL) files for competency frameworks.
Your task is to modify an existing Turtle file based on user instructions.

CRITICAL RULES:
1. Output ONLY the valid Turtle file content. No conversation, no markdown blocks, no preambles.
2. Maintain the existing prefixes and structure.
3. Ensure the output is valid Turtle that can be parsed by standard RDF tools.
4. Only modify what is requested, but ensure the resulting ontology remains consistent (e.g., if you delete an entity, remove all relations pointing to it).
5. Use the same IRIs and naming conventions as in the provided file.
`;

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

export const promptOntology = async (
    token: string,
    userPrompt: string,
    currentFileContent: string,
    schemaContext?: string | null,
    onProgress?: (message: string) => void,
    onThought?: (thought: string) => void
): Promise<string> => {
    if (!token) throw new Error("Gemini API token is missing.");

    let systemInstruction = ONTOLOGY_PROMPT_SYSTEM_INSTRUCTION;
    if (schemaContext) {
        systemInstruction += `\n\nCORE SCHEMA CONTEXT:\n${schemaContext}\n\nUse this schema to understand the valid classes and properties available in the ontology.`;
    }

    let history: any[] = [
        {
            role: 'user',
            parts: [
                { text: `SYSTEM INSTRUCTION:\n${systemInstruction}\n\nCURRENT FILE CONTENT:\n${currentFileContent}\n\nUSER REQUEST: ${userPrompt}` }
            ]
        }
    ];

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        attempts++;
        onProgress?.(attempts === 1 ? "Generating modification..." : `Parsing failed. Retry attempt ${attempts - 1}/2...`);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: history,
                    generationConfig: {
                        temperature: 0.1,
                        topP: 0.95,
                        topK: 64,
                        maxOutputTokens: 16384,
                        thinkingConfig: {
                            thinkingLevel: 'high',
                        },
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API error (${response.status}).`);
            }

            const data = await response.json();
            const candidate = data.candidates?.[0];
            const content = candidate?.content;
            
            if (candidate?.thought) {
                onThought?.(candidate.thought);
                console.log("Gemini Thought Process:", candidate.thought);
            }

            const result = content?.parts
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
            
            history.push({
                role: 'model',
                parts: [{ text: "Error in generating or parsing output." }]
            });
            history.push({
                role: 'user',
                parts: [{ text: `The previous output was invalid or could not be parsed as Turtle. Error: ${error.message}. Please try again and ensure you output ONLY valid Turtle content without any markdown formatting or preambles.` }]
            });
        }
    }

    throw new Error("Failed to generate a valid ontology modification after retries.");
};
