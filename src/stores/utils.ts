export const invertRelations = (source: Record<string, string[]>) => {
    const inverse: Record<string, string[]> = {};
    for (const [key, values] of Object.entries(source)) {
        for (const value of values) {
            if (!inverse[value]) {
                inverse[value] = [];
            }
            inverse[value].push(key);
        }
    }
    return inverse;
};

export const toNaturalName = (name: string): string => {
    return name
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Za-z])([0-9])/g, '$1 $2');
};
