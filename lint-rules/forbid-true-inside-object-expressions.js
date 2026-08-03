// @ts-check
/**
 * `clsx/forbid-true-inside-object-expressions`
 *
 * Copied from `eslint-plugin-clsx` (https://github.com/temoncher/eslint-plugin-clsx,
 * MIT licensed) — see `src/rules/forbid-true-inside-object-expressions.ts` — so this
 * package does not need a dependency on `eslint-plugin-clsx`. Converted from TypeScript to
 * JSDoc-annotated JavaScript for Oxlint's JS plugin API, with `remeda`'s `partition`
 * replaced by an inline equivalent.
 *
 * @see ./forbid-true-inside-object-expressions.md
 */

import * as utils from './utils.js';

/** @typedef {'always' | 'allowMixed'} TrueLiteralsOption */

/** @type {TrueLiteralsOption} */
const DEFAULT_OPTION = 'allowMixed';

/** @type {import('@oxlint/plugins').Rule} */
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Forbid usage of true literal inside object expressions of clsx',
            recommended: true,
            url: 'https://github.com/climatiq/oxc-presets/blob/main/lint-rules/forbid-true-inside-object-expressions.md',
        },
        fixable: 'code',
        schema: [{ type: 'string', enum: ['always', 'allowMixed'] }],
        defaultOptions: [DEFAULT_OPTION],
        messages: {
            default: 'Object expression inside clsx should not contain true literals',
        },
    },
    create(context) {
        const { sourceCode } = context;
        const clsxOptions = utils.extractClsxOptions(context);
        // Cast, not an annotation: TypeScript narrows an annotated `const` back down to its
        // initializer's literal type, which would make the `'always'` branch unreachable.
        const allowTrueLiterals = /** @type {TrueLiteralsOption} */ (
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
                    // TODO: autofix deep into arrays
                    .forEach((argumentNode) => {
                        if (argumentNode.type !== 'ObjectExpression') {
                            return;
                        }

                        /** @type {import('@oxlint/plugins').ESTree.ObjectProperty[]} */
                        const trueLiteralProps = [];
                        /** @type {import('@oxlint/plugins').ESTree.ObjectPropertyKind[]} */
                        const otherProps = [];

                        for (const prop of argumentNode.properties) {
                            if (
                                prop.type === 'Property' &&
                                prop.value.type === 'Literal' &&
                                prop.value.value === true
                            ) {
                                trueLiteralProps.push(prop);
                            } else {
                                otherProps.push(prop);
                            }
                        }

                        if (
                            trueLiteralProps.length !== 0 &&
                            (allowTrueLiterals === 'always' ||
                                (allowTrueLiterals === 'allowMixed' && otherProps.length === 0))
                        ) {
                            const trueLiteralPropsText = trueLiteralProps
                                .map((el) => {
                                    const keyText = sourceCode.getText(el.key);

                                    // Deviation from the original, which quotes every
                                    // non-computed key and so turns `{ 'a': true }` into
                                    // `''a''`. Only bare identifier keys need quoting; this
                                    // matches what `prefer-logical-over-objects` does.
                                    return !el.computed && el.key.type === 'Identifier'
                                        ? `'${keyText}'`
                                        : keyText;
                                })
                                .join(', ');
                            const otherPropsText = otherProps
                                .map((prop) => sourceCode.getText(prop))
                                .join(', ');
                            const otherPropsWrappedInObject = otherPropsText
                                ? `{ ${otherPropsText} }`
                                : undefined;

                            context.report({
                                messageId: 'default',
                                node: argumentNode,
                                fix: (fixer) =>
                                    fixer.replaceText(
                                        argumentNode,
                                        [trueLiteralPropsText, otherPropsWrappedInObject]
                                            .filter((text) => text !== undefined)
                                            .join(', '),
                                    ),
                            });
                        }
                    });
            },
        };
    },
};

export default rule;
