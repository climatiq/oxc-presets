// @ts-check
/**
 * `clsx/prefer-merged-neighboring-elements`
 *
 * Copied from `eslint-plugin-clsx` (https://github.com/temoncher/eslint-plugin-clsx,
 * MIT licensed) — see `src/rules/prefer-merged-neighboring-elements.ts` — so this package
 * does not need a dependency on `eslint-plugin-clsx`. Converted from TypeScript to
 * JSDoc-annotated JavaScript for Oxlint's JS plugin API.
 *
 * @see ./prefer-merged-neighboring-elements.md
 */

import * as utils from './utils.js';

/** @type {'object'[]} */
const DEFAULT_OPTION = ['object'];

/** @type {import('@oxlint/plugins').Rule} */
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Enforce merging of neighboring elements passed to clsx',
            recommended: true,
            url: 'https://github.com/climatiq/oxc-presets/blob/main/lint-rules/prefer-merged-neighboring-elements.md',
        },
        fixable: 'code',
        schema: [{ type: 'array', items: { type: 'string', enum: ['object'] } }],
        defaultOptions: [DEFAULT_OPTION],
        messages: {
            object: 'Neighboring objects should be merged',
        },
    },
    create(context) {
        const { sourceCode } = context;
        const clsxOptions = utils.extractClsxOptions(context);
        const mergedFor = utils.firstOption(context, DEFAULT_OPTION);

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
                    // TODO: autofix deep into arrays
                    .forEach(({ clsxCallNode, usageChunks }) => {
                        if (
                            mergedFor.includes('object') &&
                            usageChunks.some(
                                (chunk) =>
                                    chunk[0]?.type === 'ObjectExpression' && chunk.length > 1,
                            )
                        ) {
                            const args = usageChunks.map((chunk) => {
                                if (chunk[0]?.type === 'ObjectExpression') {
                                    const objectsArr =
                                        /** @type {import('@oxlint/plugins').ESTree.ObjectExpression[]} */ (
                                            chunk
                                        );
                                    const newObjectPropsText = objectsArr
                                        .flatMap((se) => se.properties)
                                        .map((prop) => sourceCode.getText(prop))
                                        .join(', ');

                                    return `{ ${newObjectPropsText} }`;
                                }

                                return chunk.map((el) => sourceCode.getText(el)).join(', ');
                            });

                            context.report({
                                messageId: 'object',
                                node: clsxCallNode,
                                fix: (fixer) =>
                                    fixer.replaceText(
                                        clsxCallNode,
                                        `${sourceCode.getText(clsxCallNode.callee)}(${args.join(', ')})`,
                                    ),
                            });
                        }

                        // TODO: add support for arrays and strings
                    });
            },
        };
    },
};

export default rule;
