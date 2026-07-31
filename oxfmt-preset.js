import { defineConfig } from 'oxfmt';

/**
 * Shared Oxfmt preset for `@climatiq/oxc-presets` consumers (plain `.js` under this
 * package’s `"type": "module"` so Node does not execute TypeScript from
 * `node_modules`).
 *
 * @see https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html
 */
export default defineConfig({
    $schema: './node_modules/oxfmt/configuration_schema.json',
    semi: true,
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 100,
    endOfLine: 'lf',
    tabWidth: 4,
    useTabs: false,
    sortPackageJson: false,
    sortTailwindcss: {
        functions: ['clsx', 'cn', 'cva', 'classNames'],
    },
    ignorePatterns: [
        '.vercel/**',
        '.claude/**/*',
        '.cache/**',
        '**/.cache/**',
        '**/.DS_Store',
        '**/.env*',
        '!**/.env.example',
        '**/.netlify/**',
        '**/.next/**',
        '**/next-env.d.ts',
        'next-env.d.ts',
        '**/.vercel/**',
        '**/.vscode/**',
        '**/*.log',
        '**/build/**',
        '**/coverage/**',
        '**/dist/**',
        '**/node_modules/**',
        '**/package-lock.json',
        '**/playwright-report/**',
        '**/playwright/.cache/**',
        '**/pnpm-lock.yaml',
        'public/**',
        '**/test-results/**',
        '**/yarn.lock',
    ],
    overrides: [
        {
            files: ['**/*.mdx'],
            options: {
                proseWrap: 'preserve',
                htmlWhitespaceSensitivity: 'ignore',
            },
        },
    ],
});
