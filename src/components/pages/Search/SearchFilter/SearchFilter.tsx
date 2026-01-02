import './SearchFilter.scss'
import {SectionHeader} from "../../../global/SectionHeader/SectionHeader.tsx";
import {DimensionFilter} from "./DimensionFilter/DimensionFilter.tsx";
import {useSearchStore} from "../../../../stores/search.ts";

type Diff = { more: Set<string>; less: Set<string> };

function FilterDimension(props: { name: string, dimension: number, labels: string[], diff: Diff }) {
    return <div className="filter-section">
        <SectionHeader>{ props.name }</SectionHeader>
        {props.labels.map(label => <DimensionFilter
            key={label}
            dimension={props.dimension}
            label={uriToLabel(label)}
            highlight={props.diff.more.has(label)}
            lowlight={props.diff.less.has(label)}
        />)
        }
    </div>;
}

export const SearchFilter = () => {

    const highlightedResult = useSearchStore(state => state.highlightedResult)
    const classification  = useSearchStore(state => state.classification)

    let areaLabels: string[] = classification.Area
    let abilityLabels: string[] = classification.Ability
    let scopeLabels: string[] = classification.Scope
    let areaDiff: Diff = { more: new Set(), less: new Set()}
    let abilityDiff: Diff = { more: new Set(), less: new Set()}
    let scopeDiff: Diff = { more: new Set(), less: new Set()}

    if (highlightedResult) {
        [ areaLabels, areaDiff] = mergeAndDiffArrays(areaLabels, highlightedResult.labels.Area);
        [ abilityLabels, abilityDiff] = mergeAndDiffArrays(abilityLabels, highlightedResult.labels.Ability);
        [ scopeLabels, scopeDiff] = mergeAndDiffArrays(scopeLabels, highlightedResult.labels.Scope);
    }

    return (
        <div className="search-filter">
            <FilterDimension name="Area" dimension={1} labels={areaLabels} diff={areaDiff} />
            <FilterDimension name="Ability" dimension={2} labels={abilityLabels} diff={abilityDiff} />
            <FilterDimension name="Scope" dimension={3} labels={scopeLabels} diff={scopeDiff} />
        </div>
    )
}

function uriToLabel(uri: string) {
    // 1. Get the part of the string after the '#' symbol.
    const fragment = uri.split('#').pop() || '';
    // 2. Add a space before each uppercase letter
    return fragment.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Merges two arrays of strings and calculates the difference between them.
 *
 * The merge operation combines the arrays and removes duplicates.
 * The diff operation identifies which values were added (`more`) in the
 * second array and which were removed (`less`).
 *
 * @param {string[]} arr1 The original array.
 * @param {string[]} arr2 The new array to merge and compare against.
 * @returns {[string[], Diff]}
 * An object containing the merged array and the diff.
 */
function mergeAndDiffArrays(arr1: string[], arr2: string[]): [string[], Diff] {
    // --- Part 1: Calculate the Diff ---

    // Use Sets for efficient lookups (O(1) average time complexity for .has())
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);

    // 'more': items that are in the second array but not in the first.
    const more = arr2.filter(item => !set1.has(item));

    // 'less': items that are in the first array but not in the second.
    const less = arr1.filter(item => !set2.has(item));

    const diff: Diff = { more: new Set(more), less: new Set(less) };


    // --- Part 2: Perform the Merge ---

    // Combine the arrays and remove duplicates using a Set
    const merged: string[] = [...new Set([...arr1, ...arr2])];


    // --- Return both results ---
    return [ merged, diff ];
}
