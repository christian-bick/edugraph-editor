import React, {useState} from 'react';
import {useCurrentOntologyStore} from '../../../../stores/ontology-store';
import {useBranchStore} from '../../../../stores/branch-store';
import {useAuthStore} from '../../../../stores/auth-store';
import {generateDefinition} from '../../../../api/gemini';
import {invertRelations, toNaturalName} from '../../../../stores/utils';
import GeminiIcon from '../../../../assets/icons/gemini.svg';

export const useDefinitionSuggest = (
    entityName: string,
    parentIri: string | null,
    currentEntityIri?: string
) => {
    const { ontologies } = useCurrentOntologyStore();
    const { activeDimension, activePerspective } = useBranchStore();
    const { geminiToken } = useAuthStore();
    const [isSuggesting, setIsSuggesting] = useState(false);

    const handleSuggest = async (existingDefinition?: string): Promise<string | null> => {
        if (!entityName || !geminiToken) return null;

        setIsSuggesting(true);
        try {
            const ontology = ontologies[activeDimension];
            if (!ontology) return null;

            const relationType = activePerspective === 'Progression' ? 'expands' : 'partOf';

            // If parentIri is not provided, try to find it from currentEntityIri
            const effectiveParentIri = parentIri || (currentEntityIri ? ontology.relations[relationType]?.[currentEntityIri]?.[0] : null);
            const parent = effectiveParentIri ? ontology.entities.find(e => e.iri === effectiveParentIri) : undefined;

            let siblings: { name: string; definition: string }[] = [];
            if (effectiveParentIri) {
                const inverted = invertRelations(ontology.relations[relationType] || {});
                const siblingIris = inverted[effectiveParentIri]?.filter(iri => iri !== currentEntityIri) || [];
                siblings = siblingIris.map(iri => {
                    const ent = ontology.entities.find(e => e.iri === iri);
                    return {
                        name: toNaturalName(ent?.name || ''),
                        definition: ent?.definition || ''
                    };
                }).filter(s => !!s.name);
            }

            const suggestion = await generateDefinition(
                geminiToken,
                toNaturalName(entityName),
                {
                    parent: parent ? { name: toNaturalName(parent.name), definition: parent.definition } : undefined,
                    siblings,
                    existingDefinition
                }
            );
            return suggestion;
        } catch (error) {
            console.error("Suggestion failed:", error);
            alert("Failed to get suggestion from Gemini.");
            return null;
        } finally {
            setIsSuggesting(false);
        }
    };

    return {
        isSuggesting,
        handleSuggest,
        canSuggest: !!geminiToken && !!entityName.trim()
    };
};

interface SuggestButtonProps {
    onClick: () => void;
    isSuggesting: boolean;
    disabled: boolean;
}

export const SuggestButton: React.FC<SuggestButtonProps> = ({ onClick, isSuggesting, disabled }) => {
    const { geminiToken } = useAuthStore();

    if (!geminiToken) return null;

    return (
        <button
            className="suggest-button"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            disabled={disabled || isSuggesting}
            type="button"
            title={disabled ? "Enter an ID/Name first" : "Get definition suggestion from Gemini"}
        >
            <img src={GeminiIcon} alt="Gemini" />
            {isSuggesting ? 'Suggesting...' : 'Suggest'}
        </button>
    );
};
