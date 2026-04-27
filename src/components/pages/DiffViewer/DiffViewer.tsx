import {useCurrentOntologyStore, useOntologyStore} from '../../../stores/ontology-store';
import {useBranchStore} from '../../../stores/branch-store';
import {serializeOntology} from '../../../stores/ontology-serializer';
import {DiffModeEnum, DiffView} from '@git-diff-view/react';
import {generateDiffFile} from "@git-diff-view/file";
import "@git-diff-view/react/styles/diff-view-pure.css";
import './DiffViewer.scss';
import {useViewStore} from '../../../stores/view-store';
import {pushOntologyFile} from '../../../api/github'; // Assuming relative path
import {useEffect, useState} from 'react';

export const DiffViewer = () => {
    const { ontologies: currentOntologyData } = useCurrentOntologyStore();
    const { ontologiesOriginal: originalOntologyData, fetchOntology } = useOntologyStore(); // Corrected destructuring
    const { activeDimension, activeBranch } = useBranchStore();
    const { toggleView } = useViewStore();

    const [isPushing, setIsPushing] = useState(false);
    const [pushError, setPushError] = useState<string | null>(null);

    const [originalText, setOriginalText] = useState<string | null>(null);
    const [currentText, setCurrentText] = useState<string | null>(null);
    const [isLoadingDiff, setIsLoadingDiff] = useState<boolean>(true);
    const [diffSerializationError, setDiffSerializationError] = useState<string | null>(null);

    const dim = activeDimension as 'Area' | 'Ability' | 'Scope';

    const originalOntology = originalOntologyData[dim];
    const currentOntology = currentOntologyData[dim];

    useEffect(() => {
        const generateDiffContent = async () => {
            if (!originalOntology || !currentOntology) {
                setDiffSerializationError("No ontology data available for comparison.");
                setIsLoadingDiff(false);
                setOriginalText(null);
                setCurrentText(null);
                return;
            }
            setIsLoadingDiff(true);
            setDiffSerializationError(null);
            try {
                const serializedOriginal = await serializeOntology(originalOntology, dim);
                const serializedCurrent = await serializeOntology(currentOntology, dim);
                setOriginalText(serializedOriginal);
                setCurrentText(serializedCurrent);
            } catch (error) {
                console.error("Error serializing ontologies:", error);
                setDiffSerializationError(`Error generating diff: ${(error as Error).message}`);
                setOriginalText(null);
                setCurrentText(null);
            } finally {
                setIsLoadingDiff(false);
            }
        };

        generateDiffContent();
    }, [originalOntology, currentOntology, dim]);


    const getOntologyFilePath = (dimension: 'Area' | 'Ability' | 'Scope') => {
        switch (dimension) {
            case 'Area': return 'core-areas-math.ttl'; // Assuming this is dynamic if the actual file varies
            case 'Ability': return 'core-abilities.ttl';
            case 'Scope': return 'core-scopes-math.ttl';
            default: throw new Error(`Unknown dimension: ${dimension}`);
        }
    };

    const onConfirm = async () => {
        setPushError(null);
        setIsPushing(true);
        try {
            const filePath = getOntologyFilePath(dim);
            // Ensure currentText is not null before pushing
            if (currentText === null) {
                 throw new Error("Serialized current ontology is not available.");
            }
            if (!originalOntology?.sha) {
                throw new Error("Original ontology SHA is not available. Please refresh.");
            }
            const commitMessage = `feat: update ${dim} ontology`;

            await pushOntologyFile(filePath, currentText, activeBranch, commitMessage, originalOntology.sha);

            // On success:
            // 1. Reset original ontology by re-fetching
            await fetchOntology(activeBranch);
            useCurrentOntologyStore.temporal.getState().clear(); // Clear undo/redo history

            // 2. Switch back to graph view
            toggleView();

            console.log('Successfully pushed to GitHub!');

        } catch (error) {
            console.error('Error pushing to GitHub:', error);
            setPushError(`Failed to push changes: ${(error as Error).message}`);
        } finally {
            setIsPushing(false);
        }
    };


    if (isLoadingDiff) {
        return <div className="diff-viewer-placeholder">Loading diff...</div>;
    }

    if (diffSerializationError) {
        return <div className="diff-viewer-placeholder error">Error: {diffSerializationError}</div>;
    }

    // If we reach here, originalText and currentText should be valid strings.
    if (originalText === null || currentText === null) {
        return <div className="diff-viewer-placeholder">No diff content to display.</div>;
    }

    const file = generateDiffFile(
        "old.ts", originalText,
        "new.ts", currentText,
        "text", "text"
    );
    file.initTheme('light');
    file.init();

    return (
        <div className="diff-viewer-container">
            <div className="diff-viewer-header">
                {pushError && <span className="push-error">{pushError}</span>}
                <button onClick={toggleView} disabled={isPushing}>Cancel</button>
                <button className="primary" onClick={onConfirm} disabled={isPushing || isLoadingDiff || diffSerializationError !== null}>
                    {isPushing ? 'Pushing...' : 'Confirm'}
                </button>
            </div>
            <DiffView diffFile={file}
                      diffViewTheme={"light"}
                      diffViewHighlight={true}
                      diffViewMode={DiffModeEnum.Split}
            />
        </div>
    );
};
