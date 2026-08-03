// @ts-check
/**
 * `clsx/no-spreading`
 *
 * Copied from `eslint-plugin-clsx` (https://github.com/temoncher/eslint-plugin-clsx,
 * MIT licensed) — see `src/rules/no-spreading.ts` — so this package does not need a
 * dependency on `eslint-plugin-clsx`. Converted from TypeScript to JSDoc-annotated
 * JavaScript for Oxlint's JS plugin API.
 *
 * @see ./no-spreading.md
 */

import * as utils from './utils.js';

/** @type {'object'[]} */
const DEFAULT_OPTION = ['object'];

/** @type {import('@oxlint/plugins').Rule} */
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Forbid spreading inside object expressions passed to clsx',
            recommended: true,
            url: 'https://github.com/climatiq/oxc-presets/blob/main/lint-rules/no-spreading.md',
        },
        fixable: 'code',
        schema: [{ type: 'array', items: { type: 'string', enum: ['object'] } }],
        defaultOptions: [DEFAULT_OPTION],
        messages: {
            default: 'Usage of object expression inside clsx is forbidden',
        },
    },
    create(context) {
        const { sourceCode } = context;
        const clsxOptions = utils.extractClsxOptions(context);
        const forbiddenFor = utils.firstOption(context, DEFAULT_OPTION);

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
                        if (
                            forbiddenFor.includes('object') &&
                            argumentNode.type === 'ObjectExpression' &&
                            argumentNode.properties.some((prop) => prop.type === 'SpreadElement')
                        ) {
                            const alternatingSpreadsAndProps = utils.chunkBy(
                                argumentNode.properties,
                                (prop) => prop.type === 'Property',
                            );

                            const args = alternatingSpreadsAndProps.map((chunk) => {
                                if (chunk[0]?.type === 'SpreadElement') {
                                    const spreadsArr =
                                        /** @type {import('@oxlint/plugins').ESTree.SpreadElement[]} */ (
                                            chunk
                                        );

                                    return spreadsArr
                                        .map((se) => sourceCode.getText(se.argument))
                                        .join(', ');
                                }

                                const propsArr =
                                    /** @type {import('@oxlint/plugins').ESTree.ObjectProperty[]} */ (
                                        chunk
                                    );
                                const propsText = propsArr
                                    .map((prop) => {
                                        const keyText = sourceCode.getText(prop.key);
                                        const valueText = sourceCode.getText(prop.value);

                                        return `${prop.computed ? `[${keyText}]` : keyText}: ${valueText}`;
                                    })
                                    .join(', ');

                                return `{ ${propsText} }`;
                            });

                            context.report({
                                messageId: 'default',
                                node: argumentNode,
                                fix: (fixer) => fixer.replaceText(argumentNode, args.join(', ')),
                            });
                        }

                        // TODO: add support for arrays
                    });
            },
        };
    },
};

export default rule;
