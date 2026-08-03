// @ts-check
import { describe, expect, test } from 'vitest';

import { diagnosticsFor, runOxlint, runOxlintFix } from './oxlint-test-utils.js';

const rules = { 'clsx/prefer-merged-neighboring-elements': 'warn' };

describe('clsx/prefer-merged-neighboring-elements', () => {
    test('allows objects that are already merged', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'class-1': true, 'class-2': flag }, someObj)\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'prefer-merged-neighboring-elements')).toHaveLength(0);
    });

    test('allows objects separated by another argument', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'class-1': true }, someObj, { 'class-2': flag })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'prefer-merged-neighboring-elements')).toHaveLength(0);
    });

    test('reports neighboring object arguments', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'class-1': true }, { 'class-2': flag })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'prefer-merged-neighboring-elements')).toHaveLength(1);
    });

    test('merges neighboring objects', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx({ ...firstObj }, { ...secondObj }, { 'class-1': true }, someObj)\n`,
            rules,
        });

        expect(fixed).toContain(`clsx({ ...firstObj, ...secondObj, 'class-1': true }, someObj)`);
    });
});
