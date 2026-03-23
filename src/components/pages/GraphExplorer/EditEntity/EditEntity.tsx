import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../../global/Modal/Modal';
import { useSelectedEntityStore } from '../../../../stores/selected-entity-store';
import './EditEntity.scss';
import { invertRelations, toNaturalName } from '../../../../stores/utils';
import { useCurrentOntologyStore } from '../../../../stores/ontology-store';
import { useBranchStore } from '../../../../stores/branch-store';
import { useAuthStore } from '../../../../stores/auth-store';
import { generateDefinition } from '../../../../api/gemini';
import GeminiIcon from '../../../../assets/icons/gemini.svg';

interface EditEntityProps {
    isOpen: boolean;
    onClose: () => void;
}

const IRI_NAMESPACE = 'http://edugraph.io/edu/';

export const EditEntity: React.FC<EditEntityProps> = ({ isOpen, onClose }) => {
    const { ontologies } = useCurrentOntologyStore();
    const { selectedEntityIri, setSelectedEntityIri } = useSelectedEntityStore();
    const { activeDimension } = useBranchStore();

    const originalEntity = useMemo(() => {
        if (!selectedEntityIri) return null;
        const ontology = ontologies[activeDimension as keyof typeof ontologies];
        return ontology?.entities.find(e => e.iri === selectedEntityIri) || null;
    }, [selectedEntityIri, ontologies, activeDimension]);
    
    const [id, setId] = useState('');
    const [definition, setDefinition] = useState('');

    useEffect(() => {
        if (originalEntity) {
            setId(originalEntity.name);
            setDefinition(originalEntity.definition);
        }
    }, [originalEntity]);
    
    const handleSave = () => {
        if (originalEntity) {
            // No-op for now, or create a new entity
            onClose();
        }
    };

    if (!isOpen || !originalEntity) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2>Edit Entity</h2>

            <div className="form-group">
                <label>ID</label>
                <div className="prefixed-input">
                    <span className="input-prefix">{IRI_NAMESPACE}</span>
                    <input
                        type="text"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Natural Name</label>
                <p className="natural-name-display">{toNaturalName(id)}</p>
            </div>

            <div className="form-group">
                <label htmlFor="definition-textarea">Definition</label>
                <textarea
                    id="definition-textarea"
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    rows={5}
                />
            </div>

            <div className="form-actions">
                <button onClick={onClose}>Cancel</button>
                <button onClick={handleSave} className="primary">Save Changes</button>
            </div>
        </Modal>
    );
};
export const EditIri: React.FC<EditEntityProps> = ({ isOpen, onClose }) => {
    const { ontologies, updateIri } = useCurrentOntologyStore();
    const { selectedEntityIri, setSelectedEntityIri } = useSelectedEntityStore();
    const { activeDimension } = useBranchStore();

    const originalEntity = useMemo(() => {
        if (!selectedEntityIri) return null;
        const ontology = ontologies[activeDimension as keyof typeof ontologies];
        return ontology?.entities.find(e => e.iri === selectedEntityIri) || null;
    }, [selectedEntityIri, ontologies, activeDimension]);

    const [id, setId] = useState('');

    useEffect(() => {
        if (originalEntity) {
            setId(originalEntity.name);
        }
    }, [originalEntity, isOpen]);

    const handleSave = () => {
        if (originalEntity) {
            const newIri = updateIri(activeDimension as 'Area' | 'Ability' | 'Scope', originalEntity, id);
            setSelectedEntityIri(newIri || null);
            onClose();
        }
    };

    if (!isOpen || !originalEntity) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2>Edit IRI</h2>

            <div className="form-group">
                <label>ID</label>
                <div className="prefixed-input">
                    <span className="input-prefix">{IRI_NAMESPACE}</span>
                    <input
                        type="text"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Natural Name</label>
                <p className="natural-name-display">{toNaturalName(id)}</p>
            </div>

            <div className="form-actions">
                <button onClick={onClose}>Cancel</button>
                <button onClick={handleSave} className="primary">Save Changes</button>
            </div>
        </Modal>
    );
};

export const EditDefinition: React.FC<EditEntityProps> = ({ isOpen, onClose }) => {
    const { ontologies, updateDefinition } = useCurrentOntologyStore();
    const { selectedEntityIri } = useSelectedEntityStore();
    const { activeDimension, activePerspective } = useBranchStore();
    const { geminiToken } = useAuthStore();

    const originalEntity = useMemo(() => {
        if (!selectedEntityIri) return null;
        const ontology = ontologies[activeDimension as keyof typeof ontologies];
        return ontology?.entities.find(e => e.iri === selectedEntityIri) || null;
    }, [selectedEntityIri, ontologies, activeDimension]);

    const [definition, setDefinition] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);

    useEffect(() => {
        if (originalEntity) {
            setDefinition(originalEntity.definition);
        }
    }, [originalEntity, isOpen]);

    const handleSuggest = async () => {
        if (!originalEntity || !geminiToken) return;

        setIsSuggesting(true);
        try {
            const ontology = ontologies[activeDimension as keyof typeof ontologies];
            const relationType = activePerspective === 'Progression' ? 'expands' : 'partOf';
            
            const parentIri = ontology.relations[relationType]?.[originalEntity.iri]?.[0];
            const parent = parentIri ? ontology.entities.find(e => e.iri === parentIri) : undefined;
            
            let siblings: { name: string; definition: string }[] = [];
            if (parentIri) {
                const inverted = invertRelations(ontology.relations[relationType]);
                const siblingIris = inverted[parentIri]?.filter(iri => iri !== originalEntity.iri) || [];
                siblings = siblingIris.map(iri => {
                    const ent = ontology.entities.find(e => e.iri === iri);
                    return { name: toNaturalName(ent?.name || ''), definition: ent?.definition || '' };
                });
            }

            const suggestion = await generateDefinition(
                geminiToken,
                toNaturalName(originalEntity.name),
                {
                    parent: parent ? { name: toNaturalName(parent.name), definition: parent.definition } : undefined,
                    siblings
                }
            );
            setDefinition(suggestion);
        } catch (error) {
            console.error("Suggestion failed:", error);
            alert("Failed to get suggestion from Gemini.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSave = () => {
        if (originalEntity) {
            updateDefinition(activeDimension as 'Area' | 'Ability' | 'Scope', originalEntity, definition);
            onClose();
        }
    };

    if (!isOpen || !originalEntity) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2>Edit Definition</h2>

            <div className="form-group">
                <label htmlFor="definition-textarea">Definition</label>
                <textarea
                    id="definition-textarea"
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    rows={5}
                />
            </div>

            <div className="form-actions">
                <div className="left-actions">
                    <button 
                        className="suggest-button" 
                        onClick={handleSuggest} 
                        disabled={isSuggesting || !geminiToken}
                    >
                        <img src={GeminiIcon} alt="Gemini" />
                        {isSuggesting ? 'Suggesting...' : 'Suggest'}
                    </button>
                </div>
                <div className="right-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleSave} className="primary">Save Changes</button>
                </div>
            </div>
        </Modal>
    );
};
