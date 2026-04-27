import React, {useEffect, useRef, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import {Modal} from '../../global/Modal/Modal';
import {useAuthStore} from '../../../stores/auth-store';
import {useBranchStore} from '../../../stores/branch-store';
import {useCurrentOntologyStore, useOntologyStore} from '../../../stores/ontology-store';
import {useChatStore} from '../../../stores/chat-store';
import {serializeOntology} from '../../../stores/ontology-serializer';
import {continueOntologyChat, executeOntologyModification, startOntologyChat} from '../../../api/gemini';
import {createEntityInfoMap, getQuadsFromString, populateOntologyFromQuads} from '../../../stores/ontology-parser';
import {RELATIONS} from '../../../config/relations';
import type {Ontology, OntologyRelations} from '../../../types/ontology-types';
import './PromptModal.scss';

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose }) => {
    const { geminiToken } = useAuthStore();
    const { activeDimension } = useBranchStore();
    const { ontologies, updateOntology } = useCurrentOntologyStore();
    const { schema } = useOntologyStore();
    const { messages, setMessages, clearMessages, wasPlanExecuted, setWasPlanExecuted } = useChatStore();

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [thought, setThought] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thought]);

    const handleSendMessage = async () => {
        if (!geminiToken) {
            setError('Gemini API token is missing. Please add it in the header.');
            return;
        }
        if (!input.trim() || isLoading) return;

        let userMessage = input.trim();
        setInput('');
        setIsLoading(true);
        setError(null);
        setStatus('Model is thinking...');
        setThought('');

        try {
            const dimension = activeDimension as 'Area' | 'Ability' | 'Scope';
            const currentOntology = ontologies[dimension];

            if (!currentOntology) {
                throw new Error(`Ontology for ${dimension} not loaded.`);
            }

            // If a plan was executed, let the model know in the next user message
            if (wasPlanExecuted) {
                userMessage = `[CONFIRMATION: The previously discussed plan was successfully executed by the user. The ontology now reflects those changes.]\n\n${userMessage}`;
                setWasPlanExecuted(false);
            }

            if (messages.length === 0) {
                const serialized = await serializeOntology(currentOntology, dimension);
                const { response, history } = await startOntologyChat(
                    geminiToken,
                    userMessage,
                    serialized,
                    schema,
                    (th) => setThought(th)
                );
                setMessages(history);
            } else {
                const { response, history } = await continueOntologyChat(
                    geminiToken,
                    userMessage,
                    messages,
                    (th) => setThought(th)
                );
                setMessages(history);
            }
            setStatus('');
        } catch (err: any) {
            console.error('Chat failed:', err);
            setError(err.message || 'An unexpected error occurred.');
            setStatus('Failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!geminiToken || messages.length === 0 || isLoading) return;

        setIsLoading(true);
        setError(null);
        setThought('');

        try {
            const dimension = activeDimension as 'Area' | 'Ability' | 'Scope';
            const currentOntology = ontologies[dimension];

            if (!currentOntology) throw new Error(`Ontology not loaded.`);

            const resultTurtle = await executeOntologyModification(
                geminiToken,
                messages,
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
                sha: currentOntology.sha
            };

            populateOntologyFromQuads(newOntology, quads, entityInfoMap, currentOntology.sha);

            updateOntology(dimension, newOntology);
            setStatus('Success!');
            setWasPlanExecuted(true);
        } catch (err: any) {
            console.error('Execution failed:', err);
            setError(err.message || 'Execution failed.');
            setStatus('Failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to clear the conversation history?')) {
            clearMessages();
            setStatus('');
            setThought('');
            setError(null);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="prompt-modal-container">
            <div className="prompt-modal chat-mode">
                <div className="prompt-modal-header">
                    <h2>AI Ontology Conversation</h2>
                    <p>Discuss changes for <strong>{activeDimension}</strong>.</p>
                </div>

                <div className="chat-history">
                    {messages.length === 0 && (
                        <div className="chat-placeholder">
                            Describe the changes you want to make. The AI will propose a plan first.
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        // Skip the first system message from UI if it's the long context
                        idx === 0 && msg.role === 'user' && msg.parts[0].text.includes('SYSTEM INSTRUCTION') ? null : (
                            <div key={idx} className={`chat-message ${msg.role}`}>
                                <div className="message-content">
                                    <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                                </div>
                            </div>
                        )
                    ))}

                    {thought && (
                        <div className="chat-message model thinking">
                            <div className="thought-process">
                                <strong>Thinking:</strong>
                                <p>{thought}</p>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {status && <div className="prompt-status">{status}</div>}
                {error && <div className="prompt-error">{error}</div>}

                <div className="chat-input-area">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Type your request or feedback here..."
                        disabled={isLoading}
                    />

                    <div className="chat-actions">
                        <div className="left-actions">
                            {messages.length > 0 && (
                                <button
                                    onClick={handleReset}
                                    className="reset-btn"
                                    disabled={isLoading}
                                >
                                    Reset Conversation
                                </button>
                            )}
                        </div>
                        <div className="right-actions">
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !input.trim()}
                                className="send-btn"
                            >
                                Send
                            </button>

                            {messages.length > 0 && !wasPlanExecuted && (
                                <button
                                    onClick={handleExecute}
                                    disabled={isLoading}
                                    className="execute-btn primary"
                                >
                                    Confirm & Execute Plan
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
