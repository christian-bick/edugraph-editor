import React, { useState } from 'react';
import { Modal } from '../../global/Modal/Modal';
import { useAuthStore } from '../../../stores/auth-store';
import { useBranchStore } from '../../../stores/branch-store';
import { useCurrentOntologyStore } from '../../../stores/ontology-store';
import { serializeOntology } from '../../../stores/ontology-serializer';
import { promptOntology } from '../../../api/gemini';
import { getQuadsFromString, createEntityInfoMap, populateOntologyFromQuads } from '../../../stores/ontology-parser';
import { RELATIONS } from '../../../config/relations';
import type { Ontology, OntologyRelations } from '../../../types/ontology-types';
import './PromptModal.scss';

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose }) => {
    const { geminiToken } = useAuthStore();
    const { activeDimension } = useBranchStore();
    const { ontologies, updateOntology } = useCurrentOntologyStore();
    
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [thought, setThought] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!geminiToken) {
            setError('Gemini API token is missing. Please add it in the header.');
            return;
        }
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setStatus('Serializing ontology...');
        setThought('');

        try {
            const dimension = activeDimension as 'Area' | 'Ability' | 'Scope';
            const currentOntology = ontologies[dimension];
            
            if (!currentOntology) {
                throw new Error(`Ontology for ${dimension} not loaded.`);
            }

            const serialized = await serializeOntology(currentOntology, dimension);
            
            const resultTurtle = await promptOntology(
                geminiToken,
                prompt,
                serialized,
                (msg) => setStatus(msg),
                (th) => setThought(th)
            );

            setStatus('Parsing result...');
            
            const quads = await getQuadsFromString(resultTurtle);
            const entityInfoMap = createEntityInfoMap(quads);
            
            const relations: OntologyRelations = {} as any;
            RELATIONS.forEach(rel => {
                relations[rel.id] = {};
            });

            const newOntology: Ontology = {
                entities: [],
                relations,
                sha: currentOntology.sha // Keep the same SHA as it's still based on the same remote file
            };

            populateOntologyFromQuads(newOntology, quads, entityInfoMap, currentOntology.sha);

            updateOntology(dimension, newOntology);
            setStatus('Success!');
            setTimeout(() => {
                onClose();
                setPrompt('');
                setStatus('');
                setThought('');
            }, 1000);

        } catch (err: any) {
            console.error('Prompt processing failed:', err);
            setError(err.message || 'An unexpected error occurred.');
            setStatus('Failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="prompt-modal">
                <h2>AI Ontology Prompt</h2>
                <p>Describe the changes you want to make to the current <strong>{activeDimension}</strong> ontology.</p>
                
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'Add a new area for Data Science under Mathematics' or 'Refine the definitions of all sub-abilities of Geometry to be more concise.'"
                    disabled={isLoading}
                />

                {status && <div className="prompt-status">{status}</div>}
                
                {thought && (
                    <div className="prompt-thought">
                        <details>
                            <summary>Model Thinking Process</summary>
                            <pre>{thought}</pre>
                        </details>
                    </div>
                )}

                {error && <div className="prompt-error">{error}</div>}

                <div className="prompt-actions">
                    <button onClick={onClose} disabled={isLoading}>Cancel</button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isLoading || !prompt.trim()} 
                        className="primary"
                    >
                        {isLoading ? 'Processing...' : 'Execute'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
