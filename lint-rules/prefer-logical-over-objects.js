// @ts-check
/**
 * `clsx/prefer-logical-over-objects`
 *
 * Copied from `eslint-plugin-clsx` (https://github.com/temoncher/eslint-plugin-clsx,
 * MIT licensed) — see `src/rules/prefer-logical-over-objects.ts` — so this package does not
 * need a dependency on `eslint-plugin-clsx`. Converted from TypeScript to JSDoc-annotated
 * JavaScript for Oxlint's JS plugin API.
 *
 * @see ./prefer-logical-over-objects.md
 */

import * as utils from './utils.js';

const DEFAULT_OPTIONS = { startingFrom: 0, endingWith: 999 };

/** @type {import('@oxlint/plugins').Rule} */
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Prefer logical expressions over object expressions inside clsx',
            recommended: false,
            url: 'https://github.com/climatiq/oxc-presets/blob/main/lint-rules/prefer-logical-over-objects.md',
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
            default: 'Usage of logical expressions is preferred over object expressions',
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
                    .flatMap((clsxCallNode) => clsxCallNode.arguments)
                    // TODO: autofix deep into arrays
                    .forEach((argumentNode) => {
                        if (
                            argumentNode.type !== 'ObjectExpression' ||
                            argumentNode.properties.length < startingFrom ||
                            argumentNode.properties.length >= endingWith
                        ) {
                            return;
                        }

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
                                const spreadsText = spreadsArr
                                    .map((se) => sourceCode.getText(se))
                                    .join(', ');

                                return `{ ${spreadsText} }`;
                            }

                            const propsArr =
                                /** @type {import('@oxlint/plugins').ESTree.ObjectProperty[]} */ (
                                    chunk
                                );

                            return propsArr
                                .map((prop) => {
                                    const keyText = sourceCode.getText(prop.key);
                                    const valueText = sourceCode.getText(prop.value);
                                    const key =
                                        !prop.computed && prop.key.type === 'Identifier'
                                            ? `'${keyText}'`
                                            : keyText;

                                    // TODO: apply `()` conditionally only as needed
                                    return `(${valueText}) && ${key}`;
                                })
                                .join(', ');
                        });

                        if (
                            argumentNode.properties.every((prop) => prop.type === 'SpreadElement')
                        ) {
                            context.report({
                                messageId: 'default',
                                node: argumentNode,
                            });

                            return;
                        }

                        context.report({
                            messageId: 'default',
                            node: argumentNode,
                            fix: (fixer) => fixer.replaceText(argumentNode, args.join(', ')),
                        });
                    });
            },
        };
    },
};

export default rule;
