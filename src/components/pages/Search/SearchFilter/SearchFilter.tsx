import './SearchFilter.scss'
import React, {useState} from 'react';
import {SectionHeader} from "../../../global/SectionHeader/SectionHeader.tsx";
import {DimensionFilter} from "./DimensionFilter/DimensionFilter.tsx";
import {useSearchStore} from "../../../../stores/search.ts";

export const SearchFilter = () => {

    const highlightedResult = useSearchStore(state => state.highlightedResult)
    const classification  = useSearchStore(state => state.classification)

    let areaLabels = classification.Area
    let abilityLabels = classification.Ability
    let scopeLabels = classification.Scope
    let areaDiff = { more: new Set(), less: new Set()}
    let abilityDiff = { more: new Set(), less: new Set()}
    let scopeDiff = { more: new Set(), less: new Set()}

    if (highlightedResult) {
        [ areaLabels, areaDiff] = mergeAndDiffArrays(areaLabels, highlightedResult.labels.Area);
        [ abilityLabels, abilityDiff] = mergeAndDiffArrays(abilityLabels, highlightedResult.labels.Ability);
        [ scopeLabels, scopeDiff] = mergeAndDiffArrays(scopeLabels, highlightedResult.labels.Scope);
    }

    return (
        <div className="search-filter">
            <div className="filter-section">
                <SectionHeader>Area</SectionHeader>
                {areaLabels.map(label => <DimensionFilter
                    key={label}
                    dimension="1"
                    label={uriToLabel(label)}
                    highlight={ areaDiff.more.has(label) }
                    lowlight={ areaDiff.less.has(label) }
                />)
                }
            </div>
            <div className="filter-section">
                <SectionHeader>Ability</SectionHeader>
                {abilityLabels.map(label => <DimensionFilter
                    key={label}
                    dimension="2"
                    label={uriToLabel(label)}
                    highlight={ abilityDiff.more.has(label) }
                    lowlight={ abilityDiff.less.has(label) }
                />)
                }
            </div>
            <div className="filter-section">
                <SectionHeader>Scope</SectionHeader>
                {scopeLabels.map(label => <DimensionFilter
                    key={label}
                    dimension="3"
                    label={uriToLabel(label)}
                    highlight={ scopeDiff.more.has(label) }
                    lowlight={ scopeDiff.less.has(label) }
                />)
                }
            </div>
        </div>
    )
}

function uriToLabel(uri) {
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
 * @returns {{merged: string[], diff: {more: string[], less: string[]}}}
 * An object containing the merged array and the diff.
 */
function mergeAndDiffArrays(arr1, arr2) {
    // --- Part 1: Calculate the Diff ---

    // Use Sets for efficient lookups (O(1) average time complexity for .has())
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);

    // 'more': items that are in the second array but not in the first.
    const more = arr2.filter(item => !set1.has(item));

    // 'less': items that are in the first array but not in the second.
    const less = arr1.filter(item => !set2.has(item));

    const diff = { more: new Set(more), less: new Set(less) };


    // --- Part 2: Perform the Merge ---

    // Combine the arrays and remove duplicates using a Set
    const merged = [...new Set([...arr1, ...arr2])];


    // --- Return both results ---
    return [ merged, diff ];
}
