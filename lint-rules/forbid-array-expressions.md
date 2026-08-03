# clsx/forbid-array-expressions

Forbid usage of array expressions inside `clsx`.

🔧 Fixable with `oxlint --fix`. Enabled as `warn` in this preset.

## Rule Details

`clsx` already accepts any number of arguments, so wrapping class names in an inline array
adds nothing. This rule reports inline array arguments and flattens them into plain
arguments.

Arrays passed by reference (a variable, a call result, …) are left alone — the rule only
looks at array literals written inline in the call.

Examples of **incorrect** code:

```js
const classes = clsx(['first-class', 'second-class']);
```

Examples of **correct** code:

```js
const classes = clsx('first-class', 'second-class');

const list = ['first-class', 'second-class'];
const dynamic = clsx('some-class', list);
```

## Options

A single string option: `'always'` (default) or `'onlySingleElement'`.

### `always` (default)

Reports every inline array argument.

```jsonc
{ "rules": { "clsx/forbid-array-expressions": ["warn", "always"] } }
```

```js
// incorrect
const classes = clsx(['first-class', 'second-class']);
// fixed
const classes = clsx('first-class', 'second-class');
```

### `onlySingleElement`

Only reports arrays with exactly one element, leaving longer arrays alone.

```jsonc
{ "rules": { "clsx/forbid-array-expressions": ["warn", "onlySingleElement"] } }
```

```js
// incorrect
const classes = clsx(['single-class']);
// fixed
const classes = clsx('single-class');

// correct — more than one element
const classes = clsx(['first-class', 'second-class']);
```

## When Not To Use It

If you prefer grouping class names into arrays inside `clsx` calls.

## Credit

Copied from [`eslint-plugin-clsx`](https://github.com/temoncher/eslint-plugin-clsx) (MIT).
