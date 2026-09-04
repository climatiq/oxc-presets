// @ts-check
import { describe, expect, it } from 'vitest';

import {
    buildDiffArgs,
    buildOxlintArgs,
    LINTABLE_EXTENSIONS,
    parseChangedFiles,
} from './changed-files.js';

describe('buildDiffArgs', () => {
    it('diffs against the base ref with three dots', () => {
        expect(buildDiffArgs('origin/main')).toContain('origin/main...HEAD');
    });

    it('excludes deleted files, which oxlint would fail on as missing paths', () => {
        expect(buildDiffArgs('origin/main')).toContain('--diff-filter=ACMR');
    });

    it('restricts the pathspec to lintable extensions', () => {
        const args = buildDiffArgs('origin/main');
        for (const ext of LINTABLE_EXTENSIONS) {
            expect(args).toContain(`*.${ext}`);
        }
    });
});

describe('parseChangedFiles', () => {
    it('returns an empty list for empty output', () => {
        // The critical case: an empty list must never reach oxlint, because
        // oxlint with no file arguments lints the entire repository.
        expect(parseChangedFiles('')).toEqual([]);
        expect(parseChangedFiles('\n\n')).toEqual([]);
    });

    it('keeps lintable files', () => {
        const out = 'src/a.ts\nsrc/b.tsx\nsrc/c.mjs\n';
        expect(parseChangedFiles(out)).toEqual(['src/a.ts', 'src/b.tsx', 'src/c.mjs']);
    });

    it('drops non-lintable files', () => {
        const out = 'README.md\npackage.json\npnpm-lock.yaml\nsrc/a.ts\n';
        expect(parseChangedFiles(out)).toEqual(['src/a.ts']);
    });

    it('does not mistake a dotted directory for an extension', () => {
        expect(parseChangedFiles('src/my.dir/a.ts\n')).toEqual(['src/my.dir/a.ts']);
        expect(parseChangedFiles('src/my.ts.snap\n')).toEqual([]);
    });

    it('preserves paths containing spaces', () => {
        expect(parseChangedFiles('src/some file.ts\n')).toEqual(['src/some file.ts']);
    });
});

describe('buildOxlintArgs', () => {
    it('passes the config and denies warnings so the gate can fail', () => {
        const args = buildOxlintArgs({
            configPath: '.oxlintrc.changed.json',
            files: ['src/a.ts'],
        });
        expect(args).toEqual(['-c', '.oxlintrc.changed.json', '--deny-warnings', 'src/a.ts']);
    });

    it('appends every file as a separate argument', () => {
        const args = buildOxlintArgs({
            configPath: 'c.json',
            files: ['a.ts', 'b with space.ts'],
        });
        expect(args.slice(-2)).toEqual(['a.ts', 'b with space.ts']);
    });
});
