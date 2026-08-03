// @ts-check
/**
 * `clsx/forbid-false-inside-object-expressions`
 *
 * Copied from `eslint-plugin-clsx` (https://github.com/temoncher/eslint-plugin-clsx,
 * MIT licensed) — see `src/rules/forbid-false-inside-object-expressions.ts` — so this
 * package does not need a dependency on `eslint-plugin-clsx`. Converted from TypeScript to
 * JSDoc-annotated JavaScript for Oxlint's JS plugin API.
 *
 * @see ./forbid-false-inside-object-expressions.md
 */

import * as utils from './utils.js';

/** @type {import('@oxlint/plugins').Rule} */
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Forbid usage of false literal inside object expressions of clsx',
            recommended: true,
            url: 'https://github.com/climatiq/oxc-presets/blob/main/lint-rules/forbid-false-inside-object-expressions.md',
        },
        fixable: 'code',
        schema: [],
        messages: {
            falseLiterals: 'Object expression inside clsx should not contain false literals',
        },
    },
    create(context) {
        const { sourceCode } = context;
        const clsxOptions = utils.extractClsxOptions(context);

        return {
            ImportDeclaration(importNode) {
                const assignedClsxName = utils.findClsxImport(importNode, clsxOptions);

                if (!assignedClsxName) {
                    return;
                }

                const clsxUsages = utils.getClsxUsages(importNode, sourceCode, assignedClsxName);

                clsxUsages
                    .flatMap((clsxCallNode) => clsxCallNode.arguments)
                    // TODO: autofix deep into arrays
                    .forEach((argumentNode) => {
                        if (argumentNode.type !== 'ObjectExpression') {
                            return;
                        }

                        const propsWithoutFalseLiterals = argumentNode.properties.filter(
                            (prop) =>
                                !(
                                    prop.type === 'Property' &&
                                    prop.value.type === 'Literal' &&
                                    prop.value.value === false
                                ),
                        );

                        if (propsWithoutFalseLiterals.length !== argumentNode.properties.length) {
                            const propsText = propsWithoutFalseLiterals
                                .map((prop) => sourceCode.getText(prop))
                                .join(', ');

                            context.report({
                                messageId: 'falseLiterals',
                                node: argumentNode,
                                fix: (fixer) => fixer.replaceText(argumentNode, `{ ${propsText} }`),
                            });
                        }
                    });
            },
        };
    },
};

export default rule;
