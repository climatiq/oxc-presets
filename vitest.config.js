// @ts-check
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['lint-rules/**/*.test.js'],
        // Each test shells out to the `oxlint` binary, which is slower than an in-process
        // rule tester.
        testTimeout: 30_000,
    },
});
