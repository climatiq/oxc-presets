// @ts-check
import { describe, expect, test } from 'vitest';

import { diagnosticsFor, runOxlint, runOxlintFix } from './oxlint-test-utils.js';

const rules = { 'clsx/no-spreading': 'warn' };

describe('clsx/no-spreading', () => {
    test('allows objects passed directly', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx(firstObj, secondObj, { 'class-1': true })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'no-spreading')).toHaveLength(0);
    });

    test('reports a spread inside an object argument', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx({ ...firstObj, 'class-1': true })\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'no-spreading')).toHaveLength(1);
    });

    test('hoists spreads out into their own arguments', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx({ ...firstObj, ...secondObj, 'class-1': true, ...someObj, 'class-2': flag })\n`,
            rules,
        });

        expect(fixed).toContain(
            `clsx(firstObj, secondObj, { 'class-1': true }, someObj, { 'class-2': flag })`,
        );
    });

    test('preserves computed keys', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx({ ...firstObj, [dynamicKey]: flag })\n`,
            rules,
        });

        expect(fixed).toContain(`clsx(firstObj, { [dynamicKey]: flag })`);
    });
});
