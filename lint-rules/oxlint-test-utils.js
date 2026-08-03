// @ts-check
/**
 * Test helpers for the `clsx` Oxlint plugin rules.
 *
 * There is no `RuleTester` for Oxlint JS plugins yet, so each rule is exercised by running
 * the real `oxlint` binary over a throwaway fixture directory. Modelled on the harness in
 * `@epic-web/config` (https://github.com/epicweb-dev/config/blob/main/lint-rules/oxlint-test-utils.js).
 */

import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach } from 'vitest';

const rootDirectory = fileURLToPath(new URL('..', import.meta.url));
const oxlintBinary = path.join(
    rootDirectory,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'oxlint.cmd' : 'oxlint',
);
const clsxPluginPath = path.join(rootDirectory, 'lint-rules', 'clsx-plugin.js');

/** @type {Set<string>} */
const temporaryDirectories = new Set();

afterEach(async () => {
    await Promise.all([...temporaryDirectories].map(cleanupTemporaryDirectory));
});

/**
 * @param {string} directory
 */
async function cleanupTemporaryDirectory(directory) {
    temporaryDirectories.delete(directory);
    await rm(directory, { force: true, recursive: true });
}

/**
 * @typedef {object} FixtureInput
 * @property {string} code Source to lint.
 * @property {Record<string, unknown>} rules `rules` section of the generated oxlint config.
 * @property {string} [filename] Name of the linted file, defaults to `sample.js`.
 * @property {Record<string, unknown>} [settings] `settings` section of the generated config.
 */

/**
 * @typedef {object} Fixture
 * @property {string} configPath
 * @property {string} directory
 * @property {string} filePath
 */

/**
 * @param {FixtureInput} input
 * @returns {Promise<Fixture>}
 */
export async function writeOxlintFixture({ code, filename = 'sample.js', rules, settings }) {
    const directory = await mkdtemp(path.join(tmpdir(), 'climatiq-oxlint-'));
    temporaryDirectories.add(directory);

    const filePath = path.join(directory, filename);
    const configPath = path.join(directory, 'oxlint.json');

    await writeFile(filePath, code);
    await writeFile(
        configPath,
        JSON.stringify({
            jsPlugins: [clsxPluginPath],
            plugins: [],
            categories: {},
            rules,
            ...(settings ? { settings } : {}),
        }),
    );

    return { configPath, directory, filePath };
}

/**
 * @param {string[]} args
 * @returns {Promise<{ exitCode: number | null, stderr: string, stdout: string }>}
 */
function spawnOxlint(args) {
    return new Promise((resolve, reject) => {
        const child = spawn(oxlintBinary, args, {
            cwd: rootDirectory,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
            stdout += chunk;
        });
        child.stderr.on('data', (chunk) => {
            stderr += chunk;
        });
        child.on('error', reject);
        child.on('close', (exitCode) => {
            resolve({ exitCode, stderr, stdout });
        });
    });
}

/**
 * Lint `input` and return oxlint's JSON report.
 *
 * @param {FixtureInput} input
 * @returns {Promise<{ diagnostics: Array<{ code?: string, message?: string }> }>}
 */
export async function runOxlint(input) {
    const fixture = await writeOxlintFixture(input);

    const result = await spawnOxlint([
        '--config',
        fixture.configPath,
        '--format',
        'json',
        fixture.filePath,
    ]);

    if (result.stderr) {
        throw new Error(result.stderr);
    }

    if (result.exitCode !== null && result.exitCode > 1) {
        throw new Error(result.stdout || `Oxlint exited with code ${result.exitCode}`);
    }

    const stdout = result.stdout.trim();

    return stdout ? JSON.parse(stdout) : { diagnostics: [] };
}

/**
 * Lint `input` with `--fix` and return the resulting file contents.
 *
 * @param {FixtureInput} input
 * @returns {Promise<string>}
 */
export async function runOxlintFix(input) {
    const fixture = await writeOxlintFixture(input);

    const result = await spawnOxlint(['--config', fixture.configPath, '--fix', fixture.filePath]);

    if (result.exitCode !== null && result.exitCode > 1) {
        throw new Error(result.stderr || result.stdout);
    }

    return readFile(fixture.filePath, 'utf8');
}

/**
 * Keep only the diagnostics produced by `ruleName`.
 *
 * @param {{ diagnostics: Array<{ code?: string, message?: string }> }} result
 * @param {string} ruleName Rule name without the plugin prefix, e.g. `no-spreading`.
 */
export function diagnosticsFor(result, ruleName) {
    return result.diagnostics.filter((diagnostic) => diagnostic.code === `clsx(${ruleName})`);
}
