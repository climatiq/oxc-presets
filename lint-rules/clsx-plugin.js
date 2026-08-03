// @ts-check
/**
 * Oxlint JS plugin exposing the `clsx/*` rules used by this preset.
 *
 * Every rule in this directory was copied from `eslint-plugin-clsx`
 * (https://github.com/temoncher/eslint-plugin-clsx, MIT licensed) and converted from
 * TypeScript to JSDoc-annotated JavaScript, so that consumers of `@climatiq/oxc-presets`
 * do not need `eslint-plugin-clsx` (or its `esquery`/`remeda` dependencies) installed.
 */

import { definePlugin } from '@oxlint/plugins';

import forbidArrayExpressions from './forbid-array-expressions.js';
import forbidFalseInsideObjectExpressions from './forbid-false-inside-object-expressions.js';
import forbidTrueInsideObjectExpressions from './forbid-true-inside-object-expressions.js';
import noRedundantClsx from './no-redundant-clsx.js';
import noSpreading from './no-spreading.js';
import preferLogicalOverObjects from './prefer-logical-over-objects.js';
import preferMergedNeighboringElements from './prefer-merged-neighboring-elements.js';
import preferObjectsOverLogical from './prefer-objects-over-logical.js';

const plugin = definePlugin({
    meta: {
        name: 'clsx',
    },
    rules: {
        'forbid-array-expressions': forbidArrayExpressions,
        'forbid-false-inside-object-expressions': forbidFalseInsideObjectExpressions,
        'forbid-true-inside-object-expressions': forbidTrueInsideObjectExpressions,
        'no-redundant-clsx': noRedundantClsx,
        'no-spreading': noSpreading,
        'prefer-logical-over-objects': preferLogicalOverObjects,
        'prefer-merged-neighboring-elements': preferMergedNeighboringElements,
        'prefer-objects-over-logical': preferObjectsOverLogical,
    },
});

export default plugin;
export {
    forbidArrayExpressions,
    forbidFalseInsideObjectExpressions,
    forbidTrueInsideObjectExpressions,
    noRedundantClsx,
    noSpreading,
    preferLogicalOverObjects,
    preferMergedNeighboringElements,
    preferObjectsOverLogical,
};
