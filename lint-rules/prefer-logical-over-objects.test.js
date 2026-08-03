// @ts-check
import { describe, expect, test } from 'vitest';

import { diagnosticsFor, runOxlint, runOxlintFix } from './oxlint-test-utils.js';

const rules = { 'clsx/prefer-logical-over-objects': 'warn' };

describe('clsx/prefer-logical-over-objects', () => {
    test('allows logical expressions', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx(condition && 'dynamic-class')\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'prefer-logical-over-objects')).toHaveLength(0);
    });

    test('reports object expressions', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': condition })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'prefer-logical-over-objects')).toHaveLength(1);
    });

    test('rewrites object properties as logical expressions', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': condition, other: flag })\n`,
            rules,
        });

        expect(fixed).toContain(`clsx((condition) && 'dynamic-class', (flag) && 'other')`);
    });

    test('respects startingFrom', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': condition })\n`,
            rules: { 'clsx/prefer-logical-over-objects': ['warn', { startingFrom: 2 }] },
        });

        expect(diagnosticsFor(result, 'prefer-logical-over-objects')).toHaveLength(0);
    });

    test('respects endingWith', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'a': condition, 'b': flag })\n`,
            rules: { 'clsx/prefer-logical-over-objects': ['warn', { endingWith: 2 }] },
        });

        expect(diagnosticsFor(result, 'prefer-logical-over-objects')).toHaveLength(0);
    });

    test('reports but does not fix objects made only of spreads', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx({ ...firstObj })\n`,
            rules,
        });

        expect(fixed).toContain(`clsx({ ...firstObj })`);
    });
});
