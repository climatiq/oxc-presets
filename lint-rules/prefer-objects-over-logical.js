// @ts-check
/**
 * `clsx/prefer-objects-over-logical`
 *
 * Copied from `eslint-plugin-clsx` (https://github.com/temoncher/eslint-plugin-clsx,
 * MIT licensed) — see `src/rules/prefer-objects-over-logical.ts` — so this package does not
 * need a dependency on `eslint-plugin-clsx`. Converted from TypeScript to JSDoc-annotated
 * JavaScript for Oxlint's JS plugin API.
 *
 * @see ./prefer-objects-over-logical.md
 */

import * as utils from './utils.js';

const DEFAULT_OPTIONS = { startingFrom: 0, endingWith: 999 };

/** @type {import('@oxlint/plugins').Rule} */
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Prefer object expressions over logical expressions inside clsx',
            recommended: false,
            url: 'https://github.com/climatiq/oxc-presets/blob/main/lint-rules/prefer-objects-over-logical.md',
        },
        fixable: 'code',
        schema: [
            {
                type: 'object',
                additionalProperties: false,
                properties: {
                    startingFrom: { type: 'number' },
                    endingWith: { type: 'number' },
                },
            },
        ],
        defaultOptions: [DEFAULT_OPTIONS],
        messages: {
            default: 'Usage of object expressions is preferred over logical expressions',
        },
    },
    create(context) {
        const { sourceCode } = context;
        const clsxOptions = utils.extractClsxOptions(context);
        const { startingFrom, endingWith } = utils.firstOption(context, DEFAULT_OPTIONS);

        return {
            ImportDeclaration(importNode) {
                const assignedClsxName = utils.findClsxImport(importNode, clsxOptions);

                if (!assignedClsxName) {
                    return;
                }

                const clsxUsages = utils.getClsxUsages(importNode, sourceCode, assignedClsxName);

                clsxUsages
                    .map((clsxCallNode) => ({
                        clsxCallNode,
                        usageChunks: utils.chunkBy(
                            clsxCallNode.arguments,
                            (argumentNode) => argumentNode.type,
                        ),
                    }))
                    .forEach(({ clsxCallNode, usageChunks }) => {
                        if (
                            !usageChunks.some(
                                (chunk) =>
                                    chunk[0]?.type === 'LogicalExpression' &&
                                    chunk.length >= startingFrom &&
                                    chunk.length < endingWith,
                            )
                        ) {
                            return;
                        }

                        const args = usageChunks.map((chunk) => {
                            if (chunk[0]?.type === 'LogicalExpression') {
                                const logicalExpressions =
                                    /** @type {import('@oxlint/plugins').ESTree.LogicalExpression[]} */ (
                                        chunk
                                    );
                                const newObjectPropsText = logicalExpressions
                                    .map((prop) => {
                                        const keyText =
                                            prop.right.type === 'Literal' &&
                                            typeof prop.right.value === 'string'
                                                ? `"${prop.right.value}"`
                                                : `[${sourceCode.getText(prop.right)}]`;
                                        const valueText = sourceCode.getText(prop.left);

                                        return `${keyText}: ${valueText}`;
                                    })
                                    .join(', ');

                                return `{ ${newObjectPropsText} }`;
                            }

                            return chunk.map((el) => sourceCode.getText(el)).join(', ');
                        });

                        context.report({
                            messageId: 'default',
                            node: clsxCallNode,
                            fix: (fixer) =>
                                fixer.replaceText(
                                    clsxCallNode,
                                    `${sourceCode.getText(clsxCallNode.callee)}(${args.join(', ')})`,
                                ),
                        });
                    });
            },
        };
    },
};

export default rule;
