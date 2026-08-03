# clsx/prefer-logical-over-objects

Prefer logical expressions over object expressions inside `clsx`.

🔧 Fixable with `oxlint --fix`. **Not** enabled in this preset — opt in per project.

## Rule Details

`clsx(condition && 'some-class')` and `clsx({ 'some-class': condition })` do the same thing.
This rule enforces the first style, rewriting object arguments into logical expressions.

It is the exact inverse of [`clsx/prefer-objects-over-logical`](./prefer-objects-over-logical.md);
enable at most one of the two, or scope them by size (see below).

Examples of **incorrect** code:

```js
const classes = clsx({ 'dynamic-class': condition, other: flag });
```

Examples of **correct** code:

```js
const classes = clsx(condition && 'dynamic-class', flag && 'other');
```

Objects made up entirely of spreads are reported but not autofixed — there is no logical
form to rewrite them to.

## Options

An object option with two properties, both matched against the number of properties in the
object argument:

| Option         | Default | Meaning                                       |
| -------------- | ------- | --------------------------------------------- |
| `startingFrom` | `0`     | Minimum number of properties before reporting |
| `endingWith`   | `999`   | Exclusive upper bound on the property count   |

```jsonc
{ "rules": { "clsx/prefer-logical-over-objects": ["warn", { "startingFrom": 2 }] } }
```

### Combining with `prefer-objects-over-logical`

Bounding both rules gives you logical expressions for short runs and objects for longer
ones:

```jsonc
{
    "rules": {
        "clsx/prefer-logical-over-objects": ["warn", { "endingWith": 3 }],
        "clsx/prefer-objects-over-logical": ["warn", { "startingFrom": 3 }],
    },
}
```

```js
// correct under the config above
const classes = clsx({ 'first-class': a, 'second-class': b, 'third-class': c }, cond && 'fourth');
```

## When Not To Use It

If you prefer the object form, or do not want to enforce either style.

## Credit

Copied from [`eslint-plugin-clsx`](https://github.com/temoncher/eslint-plugin-clsx) (MIT).
