// @ts-check
import { describe, expect, test } from 'vitest';

import { diagnosticsFor, runOxlint, runOxlintFix } from './oxlint-test-utils.js';

const rules = { 'clsx/forbid-true-inside-object-expressions': 'warn' };
const alwaysRules = { 'clsx/forbid-true-inside-object-expressions': ['warn', 'always'] };

describe('clsx/forbid-true-inside-object-expressions', () => {
    test('allows objects without true literals', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': condition })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'forbid-true-inside-object-expressions')).toHaveLength(0);
    });

    test('allows mixed objects under allowMixed (the default)', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': condition, 'true-class': true })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'forbid-true-inside-object-expressions')).toHaveLength(0);
    });

    test('reports objects that only contain true literals', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'true-class-1': true, 'true-class-2': true })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'forbid-true-inside-object-expressions')).toHaveLength(1);
    });

    test('turns true-valued properties into plain arguments', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'true-class-1': true, 'true-class-2': true })\n`,
            rules,
        });

        expect(fixed).toContain(`clsx('true-class-1', 'true-class-2')`);
    });

    test('quotes bare identifier keys when hoisting them', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx({ first: true, second: true })\n`,
            rules,
        });

        expect(fixed).toContain(`clsx('first', 'second')`);
    });

    test('reports mixed objects under always', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': condition, 'true-class': true })\n`,
            rules: alwaysRules,
        });

        expect(diagnosticsFor(result, 'forbid-true-inside-object-expressions')).toHaveLength(1);
    });

    test('keeps the remaining properties in an object under always', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': condition, 'true-class': true })\n`,
            rules: alwaysRules,
        });

        expect(fixed).toContain(`clsx('true-class', { 'dynamic-class': condition })`);
    });
});
