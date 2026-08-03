// @ts-check
/**
 * Shared helpers for the `clsx` Oxlint plugin rules.
 *
 * Copied from `eslint-plugin-clsx` (https://github.com/temoncher/eslint-plugin-clsx,
 * MIT licensed) — see `src/utils.ts` — so this package does not need a dependency on
 * `eslint-plugin-clsx`. Converted from TypeScript to JSDoc-annotated JavaScript, and the
 * `remeda` helpers it used were replaced with inline equivalents.
 */

/** @typedef {import('@oxlint/plugins').Context} Context */
/** @typedef {import('@oxlint/plugins').SourceCode} SourceCode */
/** @typedef {import('@oxlint/plugins').ESTree.CallExpression} CallExpression */
/** @typedef {import('@oxlint/plugins').ESTree.ImportDeclaration} ImportDeclaration */
/** @typedef {import('@oxlint/plugins').ESTree.Node} Node */

/**
 * Map of module specifier -> the export name(s) under which `clsx` is exposed by it.
 * `'default'` refers to the default export.
 *
 * @typedef {Record<string, string | string[]>} ClsxOptions
 */

/**
 * Default `clsxOptions`, used when the config does not set `settings.clsxOptions`.
 *
 * Kept in sync with the `settings.clsxOptions` block in `../oxlint-config.json`, because
 * Oxlint does not inherit `settings` through `extends` — without the same defaults baked in
 * here, the rules would silently ignore `cn` in every project that consumes this preset.
 *
 * Upstream's default is `{ clsx: ['default', 'clsx'], classnames: 'default' }`; the
 * `@/src/lib/utils` entry is a Climatiq addition.
 *
 * @type {ClsxOptions}
 */
const DEFAULT_CLSX_OPTIONS = {
    clsx: ['default', 'clsx'],
    classnames: ['default'],
    '@/src/lib/utils': ['cn'],
};

/**
 * @template T
 * @param {T | null | undefined} value
 * @returns {value is T}
 */
function isDefined(value) {
    return value !== undefined && value !== null;
}

/**
 * Split `collection` into runs of neighbouring elements that produce the same chunk marker.
 *
 * @template T
 * @param {readonly T[]} collection
 * @param {(el: T) => unknown} chunker
 * @returns {T[][]}
 */
export function chunkBy(collection, chunker) {
    /** @type {T[][]} */
    const res = [];

    // Deviation from the original, which reads `collection[0]` unconditionally and therefore
    // throws when the collection is empty (reachable via e.g. `clsx()` or `clsx({})`).
    if (collection.length === 0) {
        return res;
    }

    const first = /** @type {T} */ (collection[0]);
    const temp = [first];

    let lastChunkMarker = chunker(first);

    for (const el of collection.slice(1)) {
        const currentChunkMarker = chunker(el);

        if (currentChunkMarker === lastChunkMarker) {
            temp.push(el);
            continue;
        }

        if (temp.length !== 0) {
            res.push([...temp]);
            temp.length = 0;
            temp.push(el);
        }

        lastChunkMarker = currentChunkMarker;
    }

    if (temp.length) {
        res.push(temp);
    }

    return res;
}

/**
 * Given an import declaration, return the local names that `clsx` was imported under, or
 * `undefined` when the imported module is not a configured `clsx` module.
 *
 * @param {ImportDeclaration} importNode
 * @param {ClsxOptions} clsxOptions
 * @returns {string[] | undefined}
 */
export function findClsxImport(importNode, clsxOptions) {
    if (typeof importNode.source.value !== 'string') {
        throw new Error('import source value is not a string');
    }

    const names = clsxOptions[importNode.source.value];

    if (names === undefined) {
        return undefined;
    }

    const importNames = typeof names === 'string' ? [names] : names;

    return importNames
        .map((name) => {
            if (name === 'default') {
                const defaultSpecifier = importNode.specifiers.find(
                    (s) => s.type === 'ImportDefaultSpecifier',
                );

                return defaultSpecifier?.local.name;
            }

            const named = importNode.specifiers.find(
                (s) =>
                    s.type === 'ImportSpecifier' &&
                    'name' in s.imported &&
                    s.imported.name === name,
            );

            return named?.local.name;
        })
        .filter(isDefined);
}

/**
 * @template {string} N
 * @param {N} name
 * @returns {(node: Node | undefined | null) => node is CallExpression}
 */
function isCallExpressionWithName(name) {
    return (
        /**
         * @param {Node | undefined | null} node
         * @returns {node is CallExpression}
         */
        (node) =>
            !!node &&
            node.type === 'CallExpression' &&
            'name' in node.callee &&
            node.callee.name === name
    );
}

/**
 * Find every call to `clsx` (under any of the local names it was imported as).
 *
 * @param {ImportDeclaration} importNode
 * @param {SourceCode} sourceCode
 * @param {string[]} assignedClsxNames
 * @returns {CallExpression[]}
 */
export function getClsxUsages(importNode, sourceCode, assignedClsxNames) {
    return assignedClsxNames.flatMap((assignedClsxName) => {
        const variable = sourceCode.scopeManager
            ?.getDeclaredVariables(importNode)
            .find((declaredVariable) => declaredVariable.name === assignedClsxName);

        if (!variable) {
            return [];
        }

        return variable.references
            .map((ref) => ref.identifier.parent)
            .filter(isCallExpressionWithName(assignedClsxName));
    });
}

/**
 * @param {Context} context
 * @returns {ClsxOptions}
 */
export function extractClsxOptions(context) {
    return /** @type {ClsxOptions} */ (context.settings.clsxOptions ?? DEFAULT_CLSX_OPTIONS);
}

/**
 * Resolve the first rule option, falling back to `fallback` when it was not provided.
 *
 * Oxlint merges `meta.defaultOptions` into `context.options` itself, but doing it here too
 * keeps the rules correct if that ever changes, and makes the defaults visible in the code.
 *
 * @template T
 * @param {Context} context
 * @param {T} fallback
 * @returns {T}
 */
export function firstOption(context, fallback) {
    const [option] = context.options;

    if (option === undefined || option === null) {
        return fallback;
    }

    if (typeof fallback === 'object' && !Array.isArray(fallback)) {
        return { ...fallback, .../** @type {object} */ (option) };
    }

    return /** @type {T} */ (option);
}
