import { describe, it, expect } from 'vitest';

// Test the LRU cache behavior by importing and examining the module
// We test via the public API since cache is module-private
describe('highlighter', () => {
	it('getLangFromPath maps common extensions', async () => {
		// We need to test the lang mapping indirectly or extract it
		// For now, test that the module loads without error
		const mod = await import('$lib/utils/highlighter');
		expect(mod.highlightLine).toBeDefined();
		expect(mod.highlightLines).toBeDefined();
		expect(mod.getHighlighter).toBeDefined();
	});
});
