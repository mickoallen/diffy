import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [svelte({ hot: false })],
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.ts']
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib')
		}
	}
});
