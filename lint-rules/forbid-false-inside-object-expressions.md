# clsx/forbid-false-inside-object-expressions

Forbid the `false` literal inside object expressions passed to `clsx`.

🔧 Fixable with `oxlint --fix`. Enabled as `warn` in this preset.

## Rule Details

A property whose value is the literal `false` can never contribute a class name, so it is
dead weight. The rule reports such object arguments and removes the dead properties.

Only the literal `false` counts — an expression that happens to evaluate to `false` at
runtime (`!condition`, `a && b`, …) is left alone.

Examples of **incorrect** code:

```js
const classes = clsx({ 'dynamic-class': condition, 'false-class': false });
```

Examples of **correct** code:

```js
const classes = clsx({ 'dynamic-class': condition });
const classes = clsx({ 'dynamic-class': !condition });
```

## Options

None.

## When Not To Use It

If you deliberately keep `false` entries around, for example as placeholders that are
toggled during development.

## Credit

Copied from [`eslint-plugin-clsx`](https://github.com/temoncher/eslint-plugin-clsx) (MIT).
