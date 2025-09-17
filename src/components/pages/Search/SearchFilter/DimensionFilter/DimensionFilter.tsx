import './DimensionFilter.scss'

export interface DimensionFilterProps {
    dimension: number
    label: string
    highlight: boolean
    lowlight: boolean
}

export const DimensionFilter = ({dimension, label, highlight, lowlight}: DimensionFilterProps) => {
    const dimensionClass = "dimension-" + dimension

    let emphasizeClass = ""
    if (highlight) {
        emphasizeClass = "highlight"
    } else if (lowlight) {
        emphasizeClass = "lowlight"
    }

    return (
        <div className={`dimension-filter ${dimensionClass} ${emphasizeClass}`}>{label}</div>
    )
}
