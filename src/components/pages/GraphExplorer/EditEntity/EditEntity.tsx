import React, { useEffect, useState } from 'react';
import { Modal } from '../../../global/Modal/Modal';
import { SelectedEntity, useSelectedEntityStore } from '../../../../stores/selected-entity-store';
import './EditEntity.scss';
import { toNaturalName } from '../../../../stores/utils';
import { useOntologyStore } from '../../../../stores/ontology-store';
import { useBranchStore } from '../../../../stores/branch-store';

interface EditEntityProps {
    isOpen: boolean;
    onClose: () => void;
    entity: SelectedEntity | null;
}

const IRI_NAMESPACE = 'http://edugraph.io/edu/';

export const EditEntity: React.FC<EditEntityProps> = ({ isOpen, onClose, entity }) => {
    const [id, setId] = useState('');
    const [definition, setDefinition] = useState('');
    const { updateEntity } = useOntologyStore();
    const { activeDimension } = useBranchStore();
    const { setSelectedEntityIri } = useSelectedEntityStore();

    useEffect(() => {
        if (entity) {
            setId(entity.name);
            setDefinition(entity.definition);
        }
    }, [entity]);

    const handleSave = () => {
        if (entity) {
            const newIri = updateEntity(activeDimension as 'Area' | 'Ability' | 'Scope', entity, id, definition);
            setSelectedEntityIri(newIri);
            onClose();
        }
    };

    if (!entity) {
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

