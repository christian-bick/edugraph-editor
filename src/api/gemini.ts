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
    }
): Promise<string> => {
    if (!token) throw new Error("Gemini API token is missing.");

    const systemPrompt = `You are an expert in competency ontologies.
Your task is to provide a concise and precise definition for a given term within the ontology.
The definition should be strictly text, without any conversational filler, preambles (like "Sure, here is your definition"), or postambles.
Focus only on the semantic meaning of the competency.`;

    let userPrompt = `Term to define: "${term}"\n\n`;

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

    userPrompt += `Provide a definition for "${term}" based on this context.`;

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
                        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
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

