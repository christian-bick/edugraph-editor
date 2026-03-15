/// <reference types="vitest/config" />
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {storybookTest} from '@storybook/addon-vitest/vitest-plugin';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/github-api': {
                target: 'https://api.github.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/github-api/, ''),
            }
        }
    },
    test: {
        projects: [
            {
                name: 'unit',
                include: ['src/**/*.test.ts'],
            },
            {
                name: 'storybook',
                plugins: [
                    storybookTest({
                        configDir: path.join(dirname, '.storybook')
                    })],
                test: {
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: 'playwright',
                        instances: [{
                            browser: 'chromium'
                        }]
                    },
                    setupFiles: ['.storybook/vitest.setup.ts']
                }
            }
        ]
    }
});
