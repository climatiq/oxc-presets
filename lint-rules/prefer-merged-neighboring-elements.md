# clsx/prefer-merged-neighboring-elements

Enforce merging of neighbouring object arguments passed to `clsx`.

🔧 Fixable with `oxlint --fix`. Enabled as `warn` in this preset.

## Rule Details

Two object literals sitting next to each other in a `clsx` call can always be collapsed into
one. The rule reports such runs and merges them, preserving the order of everything else in
the call.

Objects that are separated by another kind of argument are left alone, because merging them
would change the order in which class names are emitted.

Examples of **incorrect** code:

```js
const classes = clsx({ ...firstObj }, { ...secondObj }, { 'class-1': true }, someObj);
```

Examples of **correct** code:

```js
const classes = clsx({ ...firstObj, ...secondObj, 'class-1': true }, someObj);
const classes = clsx({ 'class-1': true }, someObj, { 'class-2': flag });
```

## Options

An array of the argument kinds to merge. The only supported value is `'object'`, which is
also the default.

```jsonc
{ "rules": { "clsx/prefer-merged-neighboring-elements": ["warn", ["object"]] } }
```

Merging neighbouring arrays or strings is not implemented yet.

## When Not To Use It

If you group class names into separate objects on purpose — for example one object per
concern — and do not want them collapsed.

## Credit

Copied from [`eslint-plugin-clsx`](https://github.com/temoncher/eslint-plugin-clsx) (MIT).
