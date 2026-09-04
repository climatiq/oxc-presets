# Climatiq Oxc Config Presets

This package provides Climatiq's [`oxlint`](https://npmx.dev/oxlint) & [`oxfmt`](https://npmx.dev/oxfmt) configuration as a base config for any project in Climatiq.
It includes configurations for React, Next.js, TypeScript, etc.

## Installation

```bash
npm install --save-dev @climatiq/oxc-presets
```

or with yarn:

```bash
yarn add --dev @climatiq/oxc-presets
```

or with pnpm:

```bash
pnpm add -D @climatiq/oxc-presets
```

## Usage

### Oxlint

Install [Oxlint](https://npmx.dev/oxlint) alongside this package (it is listed in
peerDependencies), as well as [`oxlint-tsgolint`](https://npmx.dev/oxlint-tsgolint) for
type-aware linting.

The `clsx`/`cn` rules ship with this package as an Oxlint JS plugin, so there is nothing else
to install for them — see [`lint-rules/`](./lint-rules/index.md).

Create an `.oxlintrc.json` file in your project root with the following content:

```jsonc
{
    "$schema": "./node_modules/oxlint/configuration_schema.json",
    "extends": ["./node_modules/@climatiq/oxc-presets/oxlint-config.json"],
}
```

If you want to opt-out of type-aware linting, don't install `oxlint-tsgolint` and add the following to your oxlint config:

```jsonc
{
    "$schema": "./node_modules/oxlint/configuration_schema.json",
    "extends": ["./node_modules/@climatiq/oxc-presets/oxlint-config.json"],
    "options": {
        "typeAware": false,
    },
}
```

#### Changed-files-only rules

Some rules have a blast radius far too large to enable across an existing codebase, but are still
worth enforcing on new and modified code. Those rules live in a **separate** config,
`oxlint-config-changed.json`, which is _not_ part of the base preset — extending
`./oxlint-config.json` will never apply them to your whole repo.

Currently in this config:

- [`typescript/explicit-function-return-type`](https://oxc.rs/docs/guide/usage/linter/rules/typescript/explicit-function-return-type)
- [`import/no-default-export`](https://oxc.rs/docs/guide/usage/linter/rules/import/no-default-export)

Both are set to **`warn`**, so existing violations show up as warnings in your editor rather than
errors. The `oxc-lint-changed` command passes `--deny-warnings`, so they still fail CI on changed
files.

The changed-files config `extends` the base config, so it is a superset: everything the base config
enforces still applies, plus the two rules above.

##### Setup

Add a second config file, `.oxlintrc.changed.json`, next to your normal `.oxlintrc.json`:

```jsonc
{
    "$schema": "./node_modules/oxlint/configuration_schema.json",
    "extends": [
        "./node_modules/@climatiq/oxc-presets/oxlint-config-changed.json",
        "./.oxlintrc.json",
    ],
}
```

**List your own `.oxlintrc.json` as well**, as above. `extends` accepts several configs and later
entries win, so this keeps any rules you have turned off locally — omit it and you will get
failures for rules your repo has deliberately disabled.

Then add the script:

```jsonc
{
    "scripts": {
        "lint:check:changed": "oxc-lint-changed",
    },
}
```

`oxc-lint-changed` ships with this package. It diffs against your base branch and lints only the
files that changed, and it handles the things that are easy to get wrong by hand:

- **An empty diff lints nothing.** Piping an empty file list into `xargs oxlint` makes GNU xargs
  (i.e. Linux CI) run oxlint with no arguments, which lints the **entire repo** with the strict
  rules — while macOS's BSD xargs skips it, so the bug only appears in CI.
- **Deleted files are excluded** (`--diff-filter=ACMR`); oxlint treats a missing path as an error.
- **Shallow clones fail loudly.** `origin/main...HEAD` cannot resolve at `fetch-depth: 1`, which
  would otherwise silently lint nothing and pass.
- Only lintable extensions are passed, and paths with spaces are handled.

Options: `--base <ref>` to override the base branch (default: `origin/HEAD`, falling back to
`origin/main`), and `--config <path>` to point at a different config.

In CI, give the checkout enough history for the diff to resolve:

```yaml
- uses: actions/checkout@v4
  with:
      fetch-depth: 0
```

##### Exemptions

`import/no-default-export` is turned off only for files a framework _requires_ to default-export.
That list was derived by running the rule across real Climatiq repos and classifying every hit,
not from the Next.js docs:

- Next.js App Router convention files — `page`, `layout`, `template`, `default`, `error`,
  `global-error`, `loading`, `not-found`, plus metadata files (`icon`, `opengraph-image`,
  `sitemap`, `robots`, `manifest`, …). Matched by **filename**, so ordinary components and helpers
  that merely live under `app/` are still linted.
- `pages/**` and `src/pages/**` — the Pages Router, including `pages/api/**` handlers.
- `proxy` / `middleware` at the repo root or under `src/`. Both spellings are needed: Next 16
  accepts a named `proxy` export or a default one, and real repos use each.
- `*.config.*`, `*.d.ts`, and `__mocks__/**`.

Deliberately **not** exempted, having been checked against real code:

- `app/**/route.ts` — route handlers export named HTTP methods (`GET`, `POST`), never a default.
- `instrumentation.ts` / `instrumentation-client.ts` — named `register` / `onRequestError`.

Note that `pages/**` is anchored rather than `**/pages/**`: an unanchored glob also matches
Playwright page-object directories such as `src/__tests__/e2e/pages/`, silently exempting a whole
test tree. Override globs resolve relative to the root config that extends this one, so anchoring
works from the consuming repo's root.

`typescript/explicit-function-return-type` is TypeScript-only, allows expressions, typed function
expressions and higher-order functions, and is off for `**/components/ui/**` (shadcn-generated
components you cannot usefully annotate).

##### Editor integration

The oxlint language server reads a single config, so point it at `.oxlintrc.changed.json` to see
these rules while you type. Opening an untouched legacy file will show its existing violations as
warnings.

- **Zed** — in `.zed/settings.json`, set
  `lsp.oxlint.initialization_options.settings.configPath` to `.oxlintrc.changed.json`.
- **WebStorm / IntelliJ** — with the Oxc plugin, **Settings → Tools → Oxlint → "Path to Oxlint
  Config:"**, with the configuration mode set to manual. This is stored in `.idea/OxcSettings.xml`,
  which is usually gitignored, so each developer sets it once.

##### Why not `--suppress-all`?

Oxlint 1.80.0 ships bulk suppressions (`--suppress-all` writing `oxlint-suppressions.json`), which
would be a better fit than diffing — it works with a plain full-repo `oxlint` run and needs no git
plumbing. It is not used here because the **language server ignores the suppressions file**: a
suppressed violation is still reported as an error, so every existing violation would light up red
in the editor. Worth revisiting when the LSP honours it.

### Oxfmt

Install [Oxfmt](https://npmx.dev/oxfmt) alongside this package (it is listed in peerDependencies).

The @climatiq/oxc-presets/oxfmt entry resolves to a plain .js preset (this package uses "type": "module") so Node does not need to strip TypeScript from files under node_modules when you extend it.

Create an `oxfmt.config.ts` file in your project root:

```ts
import { defineConfig } from 'oxfmt';
import climatiqOxfmt from '@climatiq/oxc-presets/oxfmt';

export default defineConfig({
    ...climatiqOxfmt,
    printWidth: 100,
    // or any other overrides
});
```

Oxfmt does not have an `extends` field; spreading the preset and setting any top-level option afterward is how you override it (same idea for `ignorePatterns`: spread `climatiqOxfmt.ignorePatterns` and append paths).

## What's Included

### Oxlint

The Oxlint config includes:

- **Next.js** rules
- **React** rules
- **TypeScript** rules
- **clsx/cn** rules, bundled as an Oxlint JS plugin — see [`lint-rules/`](./lint-rules/index.md)
- **Unused imports** detection and auto-removal
- Sensible defaults for TypeScript projects

#### clsx/cn rules

The `clsx/*` rules are copied from
[`eslint-plugin-clsx`](https://github.com/temoncher/eslint-plugin-clsx) (MIT) and converted to
Oxlint's JS plugin API, so consumers do not need `eslint-plugin-clsx` installed. Which modules
count as `clsx` is configured through `settings.clsxOptions`; this preset ships with:

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

Oxlint does not currently inherit `settings` through `extends`, so the same map is also the
plugin's built-in default: `clsx`, `classnames` and `cn` are covered out of the box, with no
configuration on your side. Add your own `settings.clsxOptions` block only if your `cn` helper
lives somewhere else — note that it **replaces** the default rather than extending it, so
re-list `clsx` and `classnames` if you still want them covered.

Full rule documentation is in [`lint-rules/index.md`](./lint-rules/index.md).

### Oxfmt

The Oxfmt config includes:

- 1 Indentation = 4 spaces
- single-quotes
- semis
- trailing commas
- Sorting for Tailwind classes enabled

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Release process

To publish a new release, just create a new Release on the GitHub Repo Releases page with the new version.

The GitHub Actions workflow `release.yaml` will tag the new version and publish it to npm.

Therefore, the version in the package.json does not necessarily reflect the current version of the package.
