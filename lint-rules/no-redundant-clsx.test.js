// @ts-check
import { describe, expect, test } from 'vitest';

import { diagnosticsFor, runOxlint, runOxlintFix } from './oxlint-test-utils.js';

const rules = { 'clsx/no-redundant-clsx': 'warn' };

describe('clsx/no-redundant-clsx', () => {
    test('allows clsx with more than one argument', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx('a', 'b')\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'no-redundant-clsx')).toHaveLength(0);
    });

    test('allows a single non-literal argument', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx(styles.root)\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'no-redundant-clsx')).toHaveLength(0);
    });

    test('ignores calls to a function that is not the imported clsx', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = other('a')\nclsx('a', 'b')\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'no-redundant-clsx')).toHaveLength(0);
    });

    test('reports a single string literal argument', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx('single-class')\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'no-redundant-clsx')).toHaveLength(1);
    });

    test('reports a single template literal argument', async () => {
        const result = await runOxlint({
            code: "import clsx from 'clsx'\nconst classes = clsx(`single-${x}`)\n",
            rules,
        });

        expect(diagnosticsFor(result, 'no-redundant-clsx')).toHaveLength(1);
    });

    test('reports the named clsx export too', async () => {
        const result = await runOxlint({
            code: `import { clsx } from 'clsx'\nconst classes = clsx('single-class')\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'no-redundant-clsx')).toHaveLength(1);
    });

    test('honours the clsxOptions setting for custom modules', async () => {
        const result = await runOxlint({
            code: `import { classes as merge } from '~/utils'\nconst classes = merge('single-class')\n`,
            rules,
            settings: { clsxOptions: { '~/utils': ['classes'] } },
        });

        expect(diagnosticsFor(result, 'no-redundant-clsx')).toHaveLength(1);
    });

    test('covers cn from @/src/lib/utils without any settings', async () => {
        const result = await runOxlint({
            code: `import { cn } from '@/src/lib/utils'\nconst classes = cn('single-class')\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'no-redundant-clsx')).toHaveLength(1);
    });

    test('covers classnames without any settings', async () => {
        const result = await runOxlint({
            code: `import classNames from 'classnames'\nconst classes = classNames('single-class')\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'no-redundant-clsx')).toHaveLength(1);
    });

    test('ignores modules that are not configured', async () => {
        const result = await runOxlint({
            code: `import { cn } from 'some-other-lib'\nconst classes = cn('single-class')\n`,
            rules,
        });

        expect(diagnosticsFor(result, 'no-redundant-clsx')).toHaveLength(0);
    });

    test('honours a custom selector option', async () => {
        const result = await runOxlint({
            code: `import clsx from 'clsx'\nconst classes = clsx(styles.root)\n`,
            rules: {
                'clsx/no-redundant-clsx': [
                    'warn',
                    {
                        selector:
                            ':matches(Literal, TemplateLiteral, MemberExpression[object.name="styles"])',
                    },
                ],
            },
        });

        expect(diagnosticsFor(result, 'no-redundant-clsx')).toHaveLength(1);
    });

    test('unwraps the redundant call', async () => {
        const fixed = await runOxlintFix({
            code: `import clsx from 'clsx'\nconst classes = clsx('single-class')\n`,
            rules,
        });

        expect(fixed).toContain(`const classes = 'single-class'`);
    });
});
