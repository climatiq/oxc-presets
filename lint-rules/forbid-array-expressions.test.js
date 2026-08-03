// @ts-check
import { describe, expect, test } from 'vitest';

import { diagnosticsFor, runOxlint, runOxlintFix } from './oxlint-test-utils.js';

const rules = { 'clsx/forbid-array-expressions': 'warn' };
const onlySingleElementRules = {
    'clsx/forbid-array-expressions': ['warn', 'onlySingleElement'],
};

describe('clsx/forbid-array-expressions', () => {
    test('allows plain string arguments', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx('first-class', 'second-class')\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'forbid-array-expressions')).toHaveLength(0);
    });

    test('allows an array passed by reference', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst list = ['a', 'b']\nconst classes = clsx('some-class', list)\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'forbid-array-expressions')).toHaveLength(0);
    });

    test('reports an inline array (always, the default)', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx(['first-class', 'second-class'])\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'forbid-array-expressions')).toHaveLength(1);
    });

    test('flattens an inline array', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx(['first-class', 'second-class'])\n`,
            rules,
        });

        expect(fixed).toContain(`clsx('first-class', 'second-class')`);
    });

    test('allows multi-element arrays under onlySingleElement', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx(['first-class', 'second-class'])\n`,
            rules: onlySingleElementRules,
        });

        expect(diagnosticsFor(result, 'forbid-array-expressions')).toHaveLength(0);
    });

    test('reports single-element arrays under onlySingleElement', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx(['single-class'])\n`,
            rules: onlySingleElementRules,
        });

        expect(diagnosticsFor(result, 'forbid-array-expressions')).toHaveLength(1);
    });

    test('unwraps single-element arrays under onlySingleElement', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx(['single-class'])\n`,
            rules: onlySingleElementRules,
        });

        expect(fixed).toContain(`clsx('single-class')`);
    });
});
