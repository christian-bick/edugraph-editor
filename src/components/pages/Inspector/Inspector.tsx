import React, { useMemo } from 'react';
import { useCurrentOntologyStore } from '../../../stores/ontology-store';
import { useBranchStore } from '../../../stores/branch-store';
import { useViewStore } from '../../../stores/view-store';
import { useSelectedEntityStore } from '../../../stores/selected-entity-store';
import { findOntologyIssues, OntologyIssue, IssueType } from '../../../stores/ontology-inspector';
import { PerspectiveType } from '../../../config/relations';
import { toNaturalName } from '../../../stores/utils';
import './Inspector.scss';

const PERSPECTIVES: PerspectiveType[] = ['Taxonomy', 'Progression', 'Application', 'Understanding'];

export const Inspector: React.FC = () => {
    const { ontologies } = useCurrentOntologyStore();
    const { activeDimension, setActivePerspective } = useBranchStore();
    const { setView } = useViewStore();
    const { setSelectedEntityIri } = useSelectedEntityStore();

    const currentOntology = ontologies[activeDimension as keyof typeof ontologies];
    
    const issues = useMemo(() => findOntologyIssues(currentOntology), [currentOntology]);

    const issuesByType = useMemo(() => {
        const grouped: Record<IssueType, OntologyIssue[]> = {
            missing_definition: [],
            orphan_structural: []
        };
        issues.forEach(issue => {
            grouped[issue.type].push(issue);
        });
        return grouped;
    }, [issues]);

    const navigateToEntity = (iri: string, perspective: PerspectiveType) => {
        setSelectedEntityIri(iri);
        setActivePerspective(perspective);
        setView('graph');
    };

    const renderTable = (type: IssueType, title: string) => {
        const typeIssues = issuesByType[type];
        if (typeIssues.length === 0) return null;

        return (
            <div className="inspector-section">
                <h3>{title} ({typeIssues.length})</h3>
                <table className="inspector-table">
                    <thead>
                        <tr>
                            <th>Entity</th>
                            <th>Description</th>
                            <th>Actions / Perspectives</th>
                        </tr>
                    </thead>
                    <tbody>
                        {typeIssues.map((issue, idx) => (
                            <tr key={`${issue.entity.iri}-${idx}`}>
                                <td className="entity-cell">
                                    {toNaturalName(issue.entity.name)}
                                </td>
                                <td>{issue.description}</td>
                                <td className="actions-cell">
                                    <div className="perspective-buttons">
                                        {PERSPECTIVES.map(p => (
                                            <button 
                                                key={p} 
                                                onClick={() => navigateToEntity(issue.entity.iri, p)}
                                                title={`View in ${p} perspective`}
                                            >
                                                {p.charAt(0)}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="inspector-container">
            <div className="inspector-header">
                <h2>Ontology Inspector - {activeDimension}</h2>
                <button className="close-btn" onClick={() => setView('graph')}>Back to Graph</button>
            </div>
            
            <div className="inspector-content">
                {issues.length === 0 ? (
                    <div className="no-issues">No issues found in the current dimension!</div>
                ) : (
                    <>
                        {renderTable('missing_definition', 'Entities without Definition')}
                        {renderTable('orphan_structural', 'Structural Orphans (No partOf/hasPart)')}
                    </>
                )}
            </div>
        </div>
    );
};
