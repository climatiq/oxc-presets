# Lint rules

Custom Oxlint JS plugin rules shipped with `@climatiq/oxc-presets`.

Every rule here was copied from
[`eslint-plugin-clsx`](https://github.com/temoncher/eslint-plugin-clsx) (MIT licensed) and
converted from TypeScript to JSDoc-annotated JavaScript, so consumers of this preset do not
need `eslint-plugin-clsx` — or its `esquery` and `remeda` dependencies — installed. The only
runtime dependency is `definePlugin` from
[`@oxlint/plugins`](https://oxc.rs/docs/guide/usage/linter/js-plugins).

Each rule has:

- implementation: `*.js`
- tests: `*.test.js`
- documentation: `*.md`

Rules are registered through [`clsx-plugin.js`](./clsx-plugin.js), which
[`oxlint-config.json`](../oxlint-config.json) loads via `jsPlugins`.

## Rules

| Rule                                                                                         | Preset default | Fixable |
| -------------------------------------------------------------------------------------------- | -------------- | ------- |
| [`clsx/forbid-array-expressions`](./forbid-array-expressions.md)                             | `warn`         | ✅      |
| [`clsx/forbid-false-inside-object-expressions`](./forbid-false-inside-object-expressions.md) | `warn`         | ✅      |
| [`clsx/forbid-true-inside-object-expressions`](./forbid-true-inside-object-expressions.md)   | `warn`         | ✅      |
| [`clsx/no-redundant-clsx`](./no-redundant-clsx.md)                                           | `warn`         | ✅      |
| [`clsx/no-spreading`](./no-spreading.md)                                                     | `warn`         | ✅      |
| [`clsx/prefer-merged-neighboring-elements`](./prefer-merged-neighboring-elements.md)         | `warn`         | ✅      |
| [`clsx/prefer-logical-over-objects`](./prefer-logical-over-objects.md)                       | off            | ✅      |
| [`clsx/prefer-objects-over-logical`](./prefer-objects-over-logical.md)                       | off            | ✅      |

`prefer-logical-over-objects` and `prefer-objects-over-logical` are inverses of each other,
so the preset leaves both off. Enable whichever style you want per project.

## Telling the rules where `clsx` comes from

Every rule resolves `clsx` through the import that introduced it, so it only fires on real
`clsx` calls. Which modules count is controlled by `settings.clsxOptions`, a map of module
specifier to the export name(s) it exposes `clsx` under (`"default"` means the default
export):

```jsonc
{
    "settings": {
        "clsxOptions": {
            "clsx": ["default", "clsx"],
            "classnames": ["default"],
            "@/src/lib/utils": ["cn"],
        },
    },
}
```

When `settings.clsxOptions` is absent, the rules fall back to exactly the same map, which is
also the `DEFAULT_CLSX_OPTIONS` constant in [`utils.js`](./utils.js). Keep the two in sync.

> [!IMPORTANT]
> Oxlint does not inherit `settings` through `extends` (verified against oxlint 1.76), so the
> `clsxOptions` in [`oxlint-config.json`](../oxlint-config.json) only take effect when linting
> this repo. That is why the same map is baked into the plugin as its built-in default —
> consumers get `clsx`, `classnames` and `cn` without configuring anything. Only projects
> whose `cn` helper lives somewhere other than `@/src/lib/utils` need their own
> `settings.clsxOptions` block.
>
> Note that `settings.clsxOptions` **replaces** the default rather than extending it, so a
> custom block has to re-list `clsx` and `classnames` if it still wants them covered.

## Working on the rules

```bash
pnpm test        # runs the rules through the real oxlint binary
pnpm type-check  # tsc over the `// @ts-check`ed sources
pnpm lint
pnpm format
```

There is no `RuleTester` for Oxlint JS plugins yet, so
[`oxlint-test-utils.js`](./oxlint-test-utils.js) writes each test case to a throwaway
fixture directory and shells out to `oxlint` — once with `--format json` to assert on
diagnostics, and once with `--fix` to assert on the autofix output.
