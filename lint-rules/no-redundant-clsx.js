// @ts-check
/**
 * `clsx/no-redundant-clsx`
 *
 * Copied from `eslint-plugin-clsx` (https://github.com/temoncher/eslint-plugin-clsx,
 * MIT licensed) — see `src/rules/no-redundant-clsx.ts` — so this package does not need a
 * dependency on `eslint-plugin-clsx`. Converted from TypeScript to JSDoc-annotated
 * JavaScript for Oxlint's JS plugin API.
 *
 * The original matches the `selector` option against the single `clsx` argument by calling
 * `esquery` directly. Oxlint evaluates ESLint selector syntax natively, so instead the
 * selector is registered as a visitor key: matches are collected during traversal (keyed by
 * source range, because node object identity is not guaranteed to be stable) and the
 * reporting happens in `Program:exit`, once both the matches and the `clsx` calls are known.
 *
 * @see ./no-redundant-clsx.md
 */

import * as utils from './utils.js';

const DEFAULT_OPTIONS = { selector: ':matches(Literal, TemplateLiteral)' };

/**
 * @param {import('@oxlint/plugins').ESTree.Node} node
 * @returns {string}
 */
function rangeKey(node) {
    return `${node.range[0]}:${node.range[1]}`;
}

/** @type {import('@oxlint/plugins').Rule} */
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Disallow redundant clsx usage',
            recommended: true,
            url: 'https://github.com/climatiq/oxc-presets/blob/main/lint-rules/no-redundant-clsx.md',
        },
        fixable: 'code',
        schema: [
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    selector: { type: 'string' },
                },
            },
        ],
        defaultOptions: [DEFAULT_OPTIONS],
        messages: {
            default: 'clsx usage is redundant',
        },
    },
    create(context) {
        const { sourceCode } = context;
        const clsxOptions = utils.extractClsxOptions(context);
        const { selector } = utils.firstOption(context, DEFAULT_OPTIONS);

        /** @type {Set<string>} */
        const selectorMatches = new Set();
        /** @type {import('@oxlint/plugins').ESTree.CallExpression[]} */
        const clsxUsages = [];

        return {
            [selector](node) {
                selectorMatches.add(rangeKey(node));
            },
            ImportDeclaration(importNode) {
                const assignedClsxName = utils.findClsxImport(importNode, clsxOptions);

                if (!assignedClsxName) {
                    return;
                }

                clsxUsages.push(...utils.getClsxUsages(importNode, sourceCode, assignedClsxName));
            },
            'Program:exit'() {
                clsxUsages.forEach((clsxCallNode) => {
                    if (clsxCallNode.arguments.length !== 1) {
                        return;
                    }

                    const firstArg = clsxCallNode.arguments[0];

                    if (firstArg === undefined) {
                        return;
                    }

                    if (selectorMatches.has(rangeKey(firstArg))) {
                        context.report({
                            messageId: 'default',
                            node: clsxCallNode,
                            fix: (fixer) =>
                                fixer.replaceText(clsxCallNode, sourceCode.getText(firstArg)),
                        });
                    }
                });
            },
        };
    },
};

export default rule;
