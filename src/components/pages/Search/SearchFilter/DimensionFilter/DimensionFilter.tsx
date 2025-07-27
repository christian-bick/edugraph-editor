import React from 'react';
import './DimensionFilter.scss'

export interface DimensionFilterProps {
    dimension: number
    label: string
}

export const DimensionFilter = ({dimension, label}) => (
    <div className={"dimension-filter " + "dimension-" + dimension}>{label}</div>
)
