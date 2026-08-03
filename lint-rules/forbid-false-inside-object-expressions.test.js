// @ts-check
import { describe, expect, test } from 'vitest';

import { diagnosticsFor, runOxlint, runOxlintFix } from './oxlint-test-utils.js';

const rules = { 'clsx/forbid-false-inside-object-expressions': 'warn' };

describe('clsx/forbid-false-inside-object-expressions', () => {
    test('allows objects without false literals', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': condition })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'forbid-false-inside-object-expressions')).toHaveLength(0);
    });

    test('allows a false value that is not a literal', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': !condition })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'forbid-false-inside-object-expressions')).toHaveLength(0);
    });

    test('reports a false literal', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': condition, 'false-class': false })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'forbid-false-inside-object-expressions')).toHaveLength(1);
    });

    test('drops the false-valued properties', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx({ 'dynamic-class': condition, 'false-class': false })\n`,
            rules,
        });

        expect(fixed).toContain(`clsx({ 'dynamic-class': condition })`);
        expect(fixed).not.toContain('false-class');
    });
});
