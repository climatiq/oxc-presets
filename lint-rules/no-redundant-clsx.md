# clsx/no-redundant-clsx

Disallow `clsx` calls that do not do anything.

🔧 Fixable with `oxlint --fix`. Enabled as `warn` in this preset.

## Rule Details

A `clsx` call with a single argument that is already a string returns that string unchanged,
so the call is pure overhead. The rule reports those calls and replaces them with the
argument itself.

Examples of **incorrect** code:

```js
const classes = clsx('single-class');
const classes = clsx(`single-${suffix}`);
```

Examples of **correct** code:

```js
const classes = 'single-class';
const classes = clsx('first-class', 'second-class');
const classes = clsx(styles.root);
```

## Options

An object option with one property:

### `selector`

An [ESLint selector](https://eslint.org/docs/latest/extend/selectors) matched against the
single argument. If it matches, the `clsx` call is considered redundant.

Default: `":matches(Literal, TemplateLiteral)"`.

Widen it to also treat CSS-module lookups as redundant:

```jsonc
{
    "rules": {
        "clsx/no-redundant-clsx": [
            "warn",
            {
                "selector": ":matches(Literal, TemplateLiteral, MemberExpression[object.name=\"styles\"])",
            },
        ],
    },
}
```

```js
// incorrect with the selector above
const classes = clsx(styles.root);
// fixed
const classes = styles.root;
```

## When Not To Use It

If you always route class names through `clsx` for consistency, even when there is only one.

## Implementation note

Upstream calls [`esquery`](https://github.com/estools/esquery) directly to match the
selector. Oxlint evaluates ESLint selector syntax natively, so this copy registers the
selector as a visitor key instead and reports in `Program:exit`, once both the selector
matches and the `clsx` calls are known. No `esquery` dependency is needed.

## Credit

Copied from [`eslint-plugin-clsx`](https://github.com/temoncher/eslint-plugin-clsx) (MIT).
