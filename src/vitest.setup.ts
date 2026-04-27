// src/vitest.setup.ts
import {vi} from 'vitest';

const localStorageMock = (() => {
    let store: { [key: string]: string } = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        length: 0,
        key: () => null
    };
})();

vi.stubGlobal('localStorage', localStorageMock);
