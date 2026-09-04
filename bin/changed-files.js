/**
 * Pure helpers for the `oxc-lint-changed` bin.
 *
 * Kept separate from the executable so they can be unit-tested without spawning
 * git or oxlint.
 */

/** File extensions oxlint can lint. */
export const LINTABLE_EXTENSIONS = ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts'];

/**
 * Build the `git diff` arguments for the changed-file list.
 *
 * `--diff-filter=ACMR` omits deleted files: oxlint treats a path that no longer
 * exists as an error rather than skipping it.
 *
 * @param {string} baseRef
 * @returns {string[]}
 */
export function buildDiffArgs(baseRef) {
    return [
        'diff',
        '--name-only',
        '--diff-filter=ACMR',
        `${baseRef}...HEAD`,
        '--',
        ...LINTABLE_EXTENSIONS.map((ext) => `*.${ext}`),
    ];
}

/**
 * Parse `git diff --name-only` output into a list of lintable files.
 *
 * The extension filter is applied here as well as in the pathspec, so a
 * caller-supplied file list is filtered the same way.
 *
 * @param {string} stdout
 * @returns {string[]}
 */
export function parseChangedFiles(stdout) {
    return stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .filter((line) => LINTABLE_EXTENSIONS.includes(line.split('.').pop() ?? ''));
}

/**
 * Build the oxlint argv.
 *
 * `--deny-warnings` is what makes this gate fail: the rules in
 * `oxlint-config-changed.json` are warnings so they render as warnings in the
 * editor, and only become build failures here.
 *
 * @param {{ configPath: string, files: string[] }} options
 * @returns {string[]}
 */
export function buildOxlintArgs({ configPath, files }) {
    return ['-c', configPath, '--deny-warnings', ...files];
}
