import {useCurrentOntologyStore, useOntologyStore} from '../../../stores/ontology-store';
import {useBranchStore} from '../../../stores/branch-store';
import {serializeOntology} from '../../../stores/ontology-serializer';
import {DiffModeEnum, DiffView} from '@git-diff-view/react';
import {generateDiffFile} from "@git-diff-view/file";
import "@git-diff-view/react/styles/diff-view-pure.css";
import './DiffViewer.scss';

export const DiffViewer = () => {
    const { ontologies } = useCurrentOntologyStore();
    const { ontologiesOriginal } = useOntologyStore();
    const { activeDimension } = useBranchStore();

    const dim = activeDimension as 'Area' | 'Ability' | 'Scope';

    const originalOntology = ontologiesOriginal[dim];
    const currentOntology = ontologies[dim];

    if (!originalOntology || !currentOntology) {
        return <div className="diff-viewer-placeholder">No data to compare.</div>;
    }

    const originalText = serializeOntology(originalOntology, dim);
    const currentText = serializeOntology(currentOntology, dim);

    const file = generateDiffFile(
        "old.ts", originalText,
        "new.ts", currentText,
        "text", "text"
    );
    file.initTheme('light');
    file.init();

    return (
        <div className="diff-viewer-container">
            <DiffView diffFile={file}
                      diffViewTheme={"light"}
                      diffViewHighlight={true}
                      diffViewMode={DiffModeEnum.Split}
            />
        </div>
    );
};
