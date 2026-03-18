import React, {useMemo, useState} from 'react';
import {useSelectedEntityStore} from '../../../../stores/selected-entity-store';
import {useBranchStore} from '../../../../stores/branch-store.ts';
import './Sidebar.scss';
import EditIcon from '../../../../assets/icons/edit.svg';
import LinkAddIcon from '../../../../assets/icons/link_add.svg';
import LinkRmIcon from '../../../../assets/icons/link_rm.svg';
import {EditDefinition, EditIri} from '../EditEntity/EditEntity.tsx';
import {invertRelations, toNaturalName} from '../../../../stores/utils.ts';
import {useCurrentOntologyStore} from "../../../../stores/ontology-store.ts";
import {OntologyEntity} from "../../../../types/ontology-types.ts";

interface RelationSectionProps {
    title: string;
    entities: OntologyEntity[] | undefined;
    isInverse?: boolean;
    minRelations?: number;
}

const RelationSection: React.FC<RelationSectionProps> = ({ title, entities, isInverse = false, minRelations = 0 }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    if (isInverse && (!entities || entities.length === 0)) {
        return null;
    }

    const showRemoveButton = !isInverse && entities && entities.length > minRelations;

    return (
        <div className="sidebar-section">
            <div className="sidebar-header">
                <h3>{title}</h3>
                {!isInverse && (
                    <button className="edit-btn" onClick={() => setIsAddModalOpen(true)}>
                        <img src={LinkAddIcon} alt="Add Relation"/>
                    </button>
                )}
            </div>
            {entities && entities.length > 0 && (
                <ul>
                    {entities.map(e => (
                        <li key={e.iri}>
                            <span>{toNaturalName(e.name)}</span>
                            {showRemoveButton && (
                                <button className="remove-btn" onClick={() => console.log('Remove relation')}>
                                    <img src={LinkRmIcon} alt="Remove Relation"/>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {/* Modal for adding relation will be handled later */}
        </div>
    );
};


export const Sidebar: React.FC = () => {
    const { selectedEntityIri } = useSelectedEntityStore();
    const { ontologies } = useCurrentOntologyStore();
    const { activeDimension, activePerspective } = useBranchStore();
    const [isEditIriOpen, setIsEditIriOpen] = useState(false);
    const [isEditDefinitionOpen, setIsEditDefinitionOpen] = useState(false);

    const selectedEntity = useMemo(() => {
        if (!selectedEntityIri) return null;
        const ontology = ontologies[activeDimension as keyof typeof ontologies];
        if (!ontology) return null;

        const entity = ontology.entities.find(e => e.iri === selectedEntityIri);
        if (!entity) return null;

        const allEntities = ontology.entities;
        const directRelations: { [relationName: string]: OntologyEntity[] } = {};
        for (const rel in ontology.relations) {
            const relTyped = rel as keyof typeof ontology.relations;
            if (ontology.relations[relTyped]?.[entity.iri]) {
                const relatedIris = ontology.relations[relTyped]![entity.iri];
                directRelations[relTyped] = relatedIris.map(iri => allEntities.find(e => e.iri === iri)!).filter(Boolean) as OntologyEntity[];
            }
        }

        const inverseRelations = {
            expandedBy: invertRelations(ontology.relations.expands),
            hasPart: invertRelations(ontology.relations.partOf),
            includedBy: invertRelations(ontology.relations.includes),
        };

        const allRelations: { [key: string]: OntologyEntity[] } = { ...directRelations };
        for (const rel in inverseRelations) {
            const relTyped = rel as keyof typeof inverseRelations;
            if (inverseRelations[relTyped]?.[entity.iri]) {
                const relatedIris = inverseRelations[relTyped]![entity.iri];
                allRelations[relTyped] = relatedIris.map(iri => allEntities.find(e => e.iri === iri)!).filter(Boolean) as OntologyEntity[];
            }
        }

        return {
            ...entity,
            relations: allRelations,
        };
    }, [selectedEntityIri, ontologies, activeDimension]);

    return (
        <>
            <aside className="graph-explorer-sidebar">
                {selectedEntity ? (
                    <>
                        <div className="sidebar-section">
                            <h2>{toNaturalName(selectedEntity.name)}</h2>
                        </div>

                        <div className="sidebar-section">
                            <div className="sidebar-header">
                                <h3>IRI</h3>
                                <button className="edit-btn" onClick={() => setIsEditIriOpen(true)}>
                                    <img src={EditIcon} alt="Edit IRI"/>
                                </button>
                            </div>
                            <div className="section-content-wrapper">
                                <div className="iri-display">
                                    <span className="iri-namespace">http://edugraph.io/edu/</span>
                                    <span className="iri-id">{selectedEntity.name}</span>
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-section">
                            <div className="sidebar-header">
                                <h3>Description</h3>
                                <button className="edit-btn" onClick={() => setIsEditDefinitionOpen(true)}>
                                    <img src={EditIcon} alt="Edit Definition"/>
                                </button>
                            </div>
                            <div className="section-content-wrapper">
                                <p>{selectedEntity.definition}</p>
                            </div>
                        </div>

                        {activePerspective === 'Progression' ? (
                            <>
                                <RelationSection title="Expands" entities={selectedEntity.relations.expands} />
                                <RelationSection title="Expanded By" entities={selectedEntity.relations.expandedBy} isInverse />
                            </>
                        ) : (
                            <>
                                <RelationSection title="Parents" entities={selectedEntity.relations.partOf} minRelations={1} />
                                <RelationSection title="Children" entities={selectedEntity.relations.hasPart} isInverse />
                            </>
                        )}
                    </>
                ) : (
                    <div className="sidebar-placeholder">Select a node to see details.</div>
                )}
            </aside>
            <EditIri
                isOpen={isEditIriOpen}
                onClose={() => setIsEditIriOpen(false)}
            />
            <EditDefinition
                isOpen={isEditDefinitionOpen}
                onClose={() => setIsEditDefinitionOpen(false)}
            />
        </>
    );
};
