# clsx/prefer-objects-over-logical

Prefer object expressions over logical expressions inside `clsx`.

🔧 Fixable with `oxlint --fix`. **Not** enabled in this preset — opt in per project.

## Rule Details

`clsx({ 'some-class': condition })` and `clsx(condition && 'some-class')` do the same thing.
This rule enforces the first style, collapsing runs of neighbouring logical expressions into
a single object argument.

It is the exact inverse of [`clsx/prefer-logical-over-objects`](./prefer-logical-over-objects.md);
enable at most one of the two, or scope them by size (see below).

Examples of **incorrect** code:

```js
const classes = clsx(condition && 'first-class', flag && 'second-class', 'plain');
```

Examples of **correct** code:

```js
const classes = clsx({ 'first-class': condition, 'second-class': flag }, 'plain');
```

When the class name is not a string literal, a computed key is used:

```js
// before
const classes = clsx(condition && dynamicClass);
// after
const classes = clsx({ [dynamicClass]: condition });
```

## Options

An object option with two properties, both matched against the length of a run of
neighbouring logical expressions:

| Option         | Default | Meaning                                        |
| -------------- | ------- | ---------------------------------------------- |
| `startingFrom` | `0`     | Minimum length of the run before reporting     |
| `endingWith`   | `999`   | Exclusive upper bound on the length of the run |

```jsonc
{ "rules": { "clsx/prefer-objects-over-logical": ["warn", { "startingFrom": 2 }] } }
```

### Combining with `prefer-logical-over-objects`

See [`prefer-logical-over-objects`](./prefer-logical-over-objects.md#combining-with-prefer-objects-over-logical)
for the paired configuration.

## When Not To Use It

If you prefer the logical form, or do not want to enforce either style.

## Credit

Copied from [`eslint-plugin-clsx`](https://github.com/temoncher/eslint-plugin-clsx) (MIT).
