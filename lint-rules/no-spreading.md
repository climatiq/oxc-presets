# clsx/no-spreading

Forbid spreading inside object expressions passed to `clsx`.

🔧 Fixable with `oxlint --fix`. Enabled as `warn` in this preset.

## Rule Details

Spreading an object into a `clsx` object argument (`clsx({ ...obj, 'a': true })`) is
equivalent to passing it as its own argument (`clsx(obj, { 'a': true })`), but the second
form is cheaper to read and does not allocate an intermediate object.

The fix keeps the original order: each run of spreads becomes its own set of arguments, and
each run of ordinary properties is grouped back into an object.

Examples of **incorrect** code:

```js
const classes = clsx({ ...firstObj, ...secondObj, 'class-1': true, ...someObj, 'class-2': flag });
```

Examples of **correct** code:

```js
const classes = clsx(firstObj, secondObj, { 'class-1': true }, someObj, { 'class-2': flag });
```

## Options

An array of the argument kinds to check. The only supported value is `'object'`, which is
also the default.

```jsonc
{ "rules": { "clsx/no-spreading": ["warn", ["object"]] } }
```

Spreads inside array arguments are not handled yet.

## When Not To Use It

If you build up a single object of class-name conditions and prefer to keep it that way.

## Credit

Copied from [`eslint-plugin-clsx`](https://github.com/temoncher/eslint-plugin-clsx) (MIT).
