import { describe, it, expect } from 'vitest';
import { SHORTCUTS } from '$lib/utils/keyboard';

describe('keyboard shortcuts', () => {
	it('SHORTCUTS array is non-empty', () => {
		expect(SHORTCUTS.length).toBeGreaterThan(0);
	});

	it('every shortcut has key and desc', () => {
		for (const s of SHORTCUTS) {
			expect(s.key).toBeTruthy();
			expect(s.desc).toBeTruthy();
		}
	});

	it('no duplicate keys', () => {
		const keys = SHORTCUTS.map((s) => s.key);
		expect(new Set(keys).size).toBe(keys.length);
	});
});
