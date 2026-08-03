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
