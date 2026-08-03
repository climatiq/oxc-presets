// @ts-check
/**
 * `clsx/forbid-array-expressions`
 *
 * Copied from `eslint-plugin-clsx` (https://github.com/temoncher/eslint-plugin-clsx,
 * MIT licensed) — see `src/rules/forbid-array-expressions.ts` — so this package does not
 * need a dependency on `eslint-plugin-clsx`. Converted from TypeScript to JSDoc-annotated
 * JavaScript for Oxlint's JS plugin API.
 *
 * @see ./forbid-array-expressions.md
 */

import * as utils from './utils.js';

/** @typedef {'always' | 'onlySingleElement'} ArrayExpressionsOption */

/** @type {ArrayExpressionsOption} */
const DEFAULT_OPTION = 'always';

/** @type {import('@oxlint/plugins').Rule} */
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Forbid usage of array expressions inside clsx',
            recommended: true,
            url: 'https://github.com/climatiq/oxc-presets/blob/main/lint-rules/forbid-array-expressions.md',
        },
        fixable: 'code',
        schema: [{ type: 'string', enum: ['onlySingleElement', 'always'] }],
        defaultOptions: [DEFAULT_OPTION],
        messages: {
            onlySingleElement: 'Single element arrays are forbidden inside clsx',
            always: 'Usage of array expressions inside clsx is forbidden',
        },
    },
    create(context) {
        const { sourceCode } = context;
        const clsxOptions = utils.extractClsxOptions(context);
        // Cast, not an annotation: TypeScript narrows an annotated `const` back down to its
        // initializer's literal type, which would make the other branch unreachable.
        const ruleOptions = /** @type {ArrayExpressionsOption} */ (
            utils.firstOption(context, DEFAULT_OPTION)
        );

        return {
            ImportDeclaration(importNode) {
                const assignedClsxName = utils.findClsxImport(importNode, clsxOptions);

                if (!assignedClsxName) {
                    return;
                }

                const clsxUsages = utils.getClsxUsages(importNode, sourceCode, assignedClsxName);

                clsxUsages
                    .flatMap((clsxCallNode) => clsxCallNode.arguments)
                    .forEach((argumentNode) => {
                        if (argumentNode.type !== 'ArrayExpression') {
                            return;
                        }

                        if (ruleOptions === 'always') {
                            context.report({
                                messageId: 'always',
                                node: argumentNode,
                                fix: (fixer) =>
                                    fixer.replaceText(
                                        argumentNode,
                                        argumentNode.elements
                                            .map((el) => sourceCode.getText(el))
                                            .join(', '),
                                    ),
                            });

                            return;
                        }

                        if (
                            ruleOptions === 'onlySingleElement' &&
                            argumentNode.elements.length === 1
                        ) {
                            context.report({
                                messageId: 'onlySingleElement',
                                node: argumentNode,
                                fix: (fixer) =>
                                    fixer.replaceText(
                                        argumentNode,
                                        sourceCode.getText(argumentNode.elements[0]),
                                    ),
                            });
                        }
                    });
            },
        };
    },
};

export default rule;
