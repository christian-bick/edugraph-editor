import React, {useMemo, useState} from 'react';
import {useSelectedEntityStore} from '../../../../stores/selected-entity-store';
import {useBranchStore} from '../../../../stores/branch-store.ts';
import './Sidebar.scss';
import EditIcon from '../../../../assets/icons/edit.svg';
import {EditDefinition, EditIri} from '../EditEntity/EditEntity.tsx';
import {invertRelations, toNaturalName} from '../../../../stores/utils.ts';
import {useCurrentOntologyStore} from "../../../../stores/ontology-store.ts";
import {OntologyEntity} from "../../../../types/ontology-types.ts";

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

    const renderRelations = () => {
        if (!selectedEntity) return null;

        if (activePerspective === 'Progression') {
            return (
                <>
                    {selectedEntity.relations.expands && (
                        <>
                            <h4>Expands</h4>
                            <ul>
                                {selectedEntity.relations.expands.map(e => <li key={e.iri}>{toNaturalName(e.name)}</li>)}
                            </ul>
                        </>
                    )}
                    {selectedEntity.relations.expandedBy && (
                        <>
                            <h4>Expanded By</h4>
                            <ul>
                                {selectedEntity.relations.expandedBy.map(e => <li key={e.iri}>{toNaturalName(e.name)}</li>)}
                            </ul>
                        </>
                    )}
                </>
            );
        } else {
            return (
                <>
                    {selectedEntity.relations.partOf && (
                        <>
                            <h4>Parents</h4>
                            <ul>
                                {selectedEntity.relations.partOf.map(e => <li key={e.iri}>{toNaturalName(e.name)}</li>)}
                            </ul>
                        </>
                    )}

                    {selectedEntity.relations.hasPart && (
                        <>
                            <h4>Children</h4>
                            <ul>
                                {selectedEntity.relations.hasPart.map(e => <li key={e.iri}>{toNaturalName(e.name)}</li>)}
                            </ul>
                        </>
                    )}
                </>
            );
        }
    };

    return (
        <>
            <aside className="graph-explorer-sidebar">
                {selectedEntity ? (
                    <>
                        <div className="sidebar-header">
                            <h3>{toNaturalName(selectedEntity.name)}</h3>
                            <button className="edit-btn" onClick={() => setIsEditIriOpen(true)}>
                                <img src={EditIcon} alt="Edit IRI"/>
                            </button>
                        </div>

                        <div className="sidebar-header">
                            <h4>Description</h4>
                            <button className="edit-btn" onClick={() => setIsEditDefinitionOpen(true)}>
                                <img src={EditIcon} alt="Edit Definition"/>
                            </button>
                        </div>
                        <p>{selectedEntity.definition}</p>
                        {renderRelations()}
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

