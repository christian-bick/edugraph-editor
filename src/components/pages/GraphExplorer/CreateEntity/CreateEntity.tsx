import React, {useEffect, useMemo, useState} from 'react';
import { Modal } from '../../../global/Modal/Modal';
import './CreateEntity.scss';
import { toNaturalName, toCamelCase } from '../../../../stores/utils';
import { useCurrentOntologyStore } from '../../../../stores/ontology-store';
import { useBranchStore } from '../../../../stores/branch-store';
import { useDefinitionSuggest, SuggestButton } from '../DefinitionSuggest/DefinitionSuggest';

interface CreateEntityProps {
    isOpen: boolean;
    onClose: () => void;
    parentIri: string | null;
}

const IRI_NAMESPACE = 'http://edugraph.io/edu/';

export const CreateEntity: React.FC<CreateEntityProps> = ({ isOpen, onClose, parentIri }) => {
    const { ontologies, createEntity } = useCurrentOntologyStore();
    const { activeDimension } = useBranchStore();

    const [id, setId] = useState('');
    const [definition, setDefinition] = useState('');
    const [idError, setIdError] = useState<string | null>(null);

    const { isSuggesting, handleSuggest, canSuggest } = useDefinitionSuggest(
        id,
        parentIri
    );

    const allEntityNames = useMemo(() => {
        const names = new Set<string>();
        Object.values(ontologies).forEach(ontology => {
            if (ontology) {
                ontology.entities.forEach(entity => {
                    names.add(entity.name.toLowerCase());
                });
            }
        });
        return names;
    }, [ontologies]);

    useEffect(() => {
        if (!isOpen) {
            setId('');
            setDefinition('');
            setIdError(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (allEntityNames.has(id.toLowerCase().trim())) {
            setIdError('This ID is already taken.');
        } else {
            setIdError(null);
        }
    }, [id, allEntityNames]);

    const onSuggest = async () => {
        const suggestion = await handleSuggest(definition);
        if (suggestion) setDefinition(suggestion);
    };

    const handleSave = () => {
        if (id && !idError) {
            createEntity(activeDimension, parentIri, id.trim(), definition.trim());
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2>Create New Entity</h2>

            <div className="form-group">
                <label>ID</label>
                <div className="prefixed-input">
                    <span className="input-prefix">{IRI_NAMESPACE}</span>
                    <input
                        type="text"
                        value={id}
                        onChange={(e) => setId(toCamelCase(e.target.value))}
                        placeholder="e.g., NewConcept"
                    />
                </div>
                {idError && <p className="error-message">{idError}</p>}
            </div>

            <div className="form-group">
                <label>Natural Name</label>
                <p className="natural-name-display">{toNaturalName(id) || <>&nbsp;</>}</p>
            </div>

            <div className="form-group">
                <label htmlFor="definition-textarea">Definition</label>
                <textarea
                    id="definition-textarea"
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    rows={5}
                    placeholder="Enter a clear and concise definition..."
                />
            </div>

            <div className="form-actions">
                <div className="left-actions">
                    <SuggestButton 
                        onClick={onSuggest} 
                        isSuggesting={isSuggesting} 
                        disabled={!canSuggest} 
                    />
                </div>
                <div className="right-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleSave} className="primary" disabled={!id || !!idError}>Create Entity</button>
                </div>
            </div>
        </Modal>
    );
};
