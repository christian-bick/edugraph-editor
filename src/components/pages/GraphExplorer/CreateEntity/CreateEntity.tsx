import React, { useState } from 'react';
import { Modal } from '../../../global/Modal/Modal';
import './CreateEntity.scss';
import { toNaturalName } from '../../../../stores/utils';
import { useCurrentOntologyStore } from '../../../../stores/ontology-store';
import { useBranchStore } from '../../../../stores/branch-store';

interface CreateEntityProps {
    isOpen: boolean;
    onClose: () => void;
    parentIri: string | null;
}

const IRI_NAMESPACE = 'http://edugraph.io/edu/';

export const CreateEntity: React.FC<CreateEntityProps> = ({ isOpen, onClose, parentIri }) => {
    const { createEntity } = useCurrentOntologyStore();
    const { activeDimension } = useBranchStore();
    
    const [id, setId] = useState('');
    const [definition, setDefinition] = useState('');

    const handleSave = () => {
        if (id && definition) {
            createEntity(activeDimension, parentIri, id, definition);
            onClose();
        }
    };

    if (!isOpen) {
        return null;
    }

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
                        onChange={(e) => setId(e.target.value)}
                        placeholder="e.g., NewConcept"
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
                    placeholder="Enter a clear and concise definition..."
                />
            </div>

            <div className="form-actions">
                <button onClick={onClose}>Cancel</button>
                <button onClick={handleSave} className="primary" disabled={!id || !definition}>Create Entity</button>
            </div>
        </Modal>
    );
};
