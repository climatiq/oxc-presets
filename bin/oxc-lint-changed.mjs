#!/usr/bin/env node
/**
 * Lint only the files changed on the current branch, using the stricter
 * `oxlint-config-changed.json` preset.
 *
 * Usage:
 *   oxc-lint-changed [--base <ref>] [--config <path>]
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

import { buildDiffArgs, buildOxlintArgs, parseChangedFiles } from './changed-files.js';

const DEFAULT_CONFIG = '.oxlintrc.changed.json';

/** @param {string} message */
function fail(message) {
    console.error(`oxc-lint-changed: ${message}`);
    process.exit(1);
}

/** @param {string[]} argv */
function parseArgs(argv) {
    const options = { base: undefined, config: undefined };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--base' || arg === '--config') {
            const value = argv[i + 1];
            if (!value) {
                fail(`${arg} requires a value`);
            }
            options[arg === '--base' ? 'base' : 'config'] = value;
            i++;
        } else if (arg === '-h' || arg === '--help') {
            console.log('Usage: oxc-lint-changed [--base <ref>] [--config <path>]');
            process.exit(0);
        } else {
            fail(`unknown argument: ${arg}`);
        }
    }
    return options;
}

/**
 * @param {string[]} args
 * @returns {{ status: number | null, stdout: string }}
 */
function git(args) {
    const result = spawnSync('git', args, { encoding: 'utf8' });
    return { status: result.status, stdout: result.stdout ?? '' };
}

/**
 * Resolve the branch to diff against: `origin/HEAD` if the remote publishes it,
 * otherwise `origin/main`.
 *
 * @returns {string}
 */
function resolveBaseRef() {
    const symbolic = git(['rev-parse', '--abbrev-ref', 'origin/HEAD']);
    if (symbolic.status === 0) {
        const ref = symbolic.stdout.trim();
        if (ref && ref !== 'origin/HEAD') {
            return ref;
        }
    }
    return 'origin/main';
}

/**
 * Locate the `oxlint` executable.
 *
 * Resolved from the consuming project rather than taken from `PATH`: `PATH`
 * only contains `node_modules/.bin` when this runs as an npm/pnpm script, so a
 * direct `node …/oxc-lint-changed.mjs` invocation would otherwise fail with
 * ENOENT.
 *
 * @returns {string}
 */
function resolveOxlintBin() {
    const require = createRequire(path.join(process.cwd(), 'noop.js'));
    try {
        const manifestPath = require.resolve('oxlint/package.json');
        const manifest = require('oxlint/package.json');
        const relative = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.oxlint;
        if (relative) {
            const resolved = path.join(path.dirname(manifestPath), relative);
            if (existsSync(resolved)) {
                return resolved;
            }
        }
    } catch {
        // Not resolvable from the project; fall back to PATH below.
    }
    return 'oxlint';
}

const options = parseArgs(process.argv.slice(2));

if (git(['rev-parse', '--is-inside-work-tree']).status !== 0) {
    fail('not inside a git repository');
}

// A shallow clone cannot resolve `<base>...HEAD`. Without this check the diff
// comes back empty and the whole gate silently passes. CI checkouts default to
// depth 1, so this is the common case, not an edge case.
if (git(['rev-parse', '--is-shallow-repository']).stdout.trim() === 'true') {
    fail(
        'shallow clone detected — cannot diff against the base branch.\n' +
            '  In GitHub Actions, set `fetch-depth: 0` on actions/checkout.',
    );
}

// Validated before the diff so a misconfigured path fails the same way on every
// run, rather than only on branches that happen to touch a lintable file.
const configPath = options.config ?? DEFAULT_CONFIG;
if (!existsSync(configPath)) {
    fail(
        `config '${configPath}' not found.\n` +
            '  Create it, extending this package and your own config:\n' +
            '    { "extends": [\n' +
            '        "./node_modules/@climatiq/oxc-presets/oxlint-config-changed.json",\n' +
            '        "./.oxlintrc.json"\n' +
            '    ] }',
    );
}

const baseRef = options.base ?? resolveBaseRef();

if (git(['rev-parse', '--verify', baseRef]).status !== 0) {
    fail(`base ref '${baseRef}' not found — fetch it first, or pass --base <ref>`);
}

const diff = git(buildDiffArgs(baseRef));
if (diff.status !== 0) {
    fail(`git diff against '${baseRef}' failed`);
}

const files = parseChangedFiles(diff.stdout);

// Nothing to lint. Returning early is essential: passing zero file arguments to
// oxlint makes it lint the entire repository, which would apply these rules to
// all existing code.
if (files.length === 0) {
    console.log(`oxc-lint-changed: no changed files to lint (base: ${baseRef})`);
    process.exit(0);
}

console.log(`oxc-lint-changed: linting ${files.length} changed file(s) against ${baseRef}`);

const oxlint = spawnSync(resolveOxlintBin(), buildOxlintArgs({ configPath, files }), {
    stdio: 'inherit',
});

if (oxlint.error) {
    fail(
        `could not run oxlint: ${oxlint.error.message}\n` +
            '  Is `oxlint` installed in this project? It is a peer dependency.',
    );
}

process.exit(oxlint.status ?? 1);
