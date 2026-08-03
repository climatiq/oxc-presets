# clsx/forbid-true-inside-object-expressions

Forbid the `true` literal inside object expressions passed to `clsx`.

🔧 Fixable with `oxlint --fix`. Enabled as `warn` in this preset.

## Rule Details

`{ 'some-class': true }` is a roundabout way of writing `'some-class'`. This rule reports
those properties and hoists them out of the object into plain string arguments.

Bare identifier keys are quoted when hoisted (`{ first: true }` → `'first'`); keys that are
already string literals or computed are kept as written.

Examples of **incorrect** code:

```js
const classes = clsx({ 'true-class-1': true, 'true-class-2': true });
```

Examples of **correct** code:

```js
const classes = clsx('true-class-1', 'true-class-2');
const classes = clsx({ 'dynamic-class': condition });
```

## Options

A single string option: `'allowMixed'` (default) or `'always'`.

### `allowMixed` (default)

Only reports objects made up **entirely** of `true` literals. Objects that also carry
dynamic entries are left alone, because splitting them would be more churn than it is worth.

```jsonc
{ "rules": { "clsx/forbid-true-inside-object-expressions": ["warn", "allowMixed"] } }
```

```js
// incorrect
const classes = clsx({ 'true-class-1': true, 'true-class-2': true });
// fixed
const classes = clsx('true-class-1', 'true-class-2');

// correct — mixed object
const classes = clsx({ 'dynamic-class': condition, 'true-class': true });
```

### `always`

Also reports mixed objects, hoisting the `true` entries and keeping the rest in an object.

```jsonc
{ "rules": { "clsx/forbid-true-inside-object-expressions": ["warn", "always"] } }
```

```js
// incorrect
const classes = clsx({ 'dynamic-class': condition, 'true-class': true });
// fixed
const classes = clsx('true-class', { 'dynamic-class': condition });
```

## When Not To Use It

If you prefer keeping every class name in one object literal, regardless of whether the
condition is static.

## Credit

Copied from [`eslint-plugin-clsx`](https://github.com/temoncher/eslint-plugin-clsx) (MIT).
The upstream autofix quotes every non-computed key, which turns `{ 'a': true }` into `''a''`;
this copy only quotes bare identifier keys.
