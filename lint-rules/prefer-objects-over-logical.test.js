// @ts-check
import { describe, expect, test } from 'vitest';

import { diagnosticsFor, runOxlint, runOxlintFix } from './oxlint-test-utils.js';

const rules = { 'clsx/prefer-objects-over-logical': 'warn' };

describe('clsx/prefer-objects-over-logical', () => {
    test('allows object expressions', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': condition })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'prefer-objects-over-logical')).toHaveLength(0);
    });

    test('reports logical expressions', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx(condition && 'dynamic-class')\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'prefer-objects-over-logical')).toHaveLength(1);
    });

    test('rewrites neighboring logical expressions into one object', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx(condition && 'first-class', flag && 'second-class', 'plain')\n`,
            rules,
        });

        expect(fixed).toContain(
            `clsx({ "first-class": condition, "second-class": flag }, 'plain')`,
        );
    });

    test('uses a computed key when the class name is not a string literal', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx(condition && dynamicClass)\n`,
            rules,
        });

        expect(fixed).toContain(`clsx({ [dynamicClass]: condition })`);
    });

    test('respects startingFrom', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx(condition && 'dynamic-class')\n`,
            rules: { 'clsx/prefer-objects-over-logical': ['warn', { startingFrom: 2 }] },
        });

        expect(diagnosticsFor(result, 'prefer-objects-over-logical')).toHaveLength(0);
    });

    test('respects endingWith', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx(condition && 'first-class', flag && 'second-class')\n`,
            rules: { 'clsx/prefer-objects-over-logical': ['warn', { endingWith: 2 }] },
        });

        expect(diagnosticsFor(result, 'prefer-objects-over-logical')).toHaveLength(0);
    });
});
