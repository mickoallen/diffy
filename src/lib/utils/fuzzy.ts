export interface FuzzyResult<T> {
	item: T;
	score: number;
	matches: number[];
}

/**
 * Tiny fuzzy matcher: every character in `query` (lowercased) must appear in `text` (lowercased)
 * in order. Scoring rewards consecutive matches, matches at word boundaries, and earlier matches.
 * Returns null if the query can't be matched at all.
 */
export function fuzzyScore(text: string, query: string): { score: number; matches: number[] } | null {
	if (!query) return { score: 0, matches: [] };
	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const matches: number[] = [];

	let ti = 0;
	let qi = 0;
	let score = 0;
	let prevMatch = -2;

	while (qi < lowerQuery.length && ti < lowerText.length) {
		if (lowerText[ti] === lowerQuery[qi]) {
			matches.push(ti);
			// Consecutive match bonus
			if (ti === prevMatch + 1) score += 5;
			else score += 1;
			// Boundary bonus (match after '/', '.', '-', '_', or at start)
			const prevChar = ti === 0 ? '/' : lowerText[ti - 1];
			if (/[\/._\-\s]/.test(prevChar)) score += 3;
			// Exact-case bonus
			if (text[ti] === query[qi]) score += 1;
			prevMatch = ti;
			qi++;
		}
		ti++;
	}

	if (qi < lowerQuery.length) return null;
	// Slight penalty for long texts (prefer shorter matches when tied).
	score -= Math.floor(text.length / 50);
	return { score, matches };
}

export function fuzzyFilter<T>(items: T[], query: string, key: (item: T) => string): FuzzyResult<T>[] {
	if (!query) return items.map((item) => ({ item, score: 0, matches: [] }));
	const results: FuzzyResult<T>[] = [];
	for (const item of items) {
		const res = fuzzyScore(key(item), query);
		if (res) results.push({ item, score: res.score, matches: res.matches });
	}
	results.sort((a, b) => b.score - a.score);
	return results;
}

/**
 * Given a string and the list of matching character positions, return HTML with <mark> around matches.
 */
export function highlightMatches(text: string, matches: number[]): string {
	if (matches.length === 0) return escapeHtml(text);
	const set = new Set(matches);
	let out = '';
	let inMark = false;
	for (let i = 0; i < text.length; i++) {
		const shouldMark = set.has(i);
		if (shouldMark && !inMark) {
			out += '<mark>';
			inMark = true;
		} else if (!shouldMark && inMark) {
			out += '</mark>';
			inMark = false;
		}
		out += escapeHtmlChar(text[i]);
	}
	if (inMark) out += '</mark>';
	return out;
}

function escapeHtml(s: string): string {
	let out = '';
	for (const ch of s) out += escapeHtmlChar(ch);
	return out;
}

function escapeHtmlChar(ch: string): string {
	switch (ch) {
		case '&': return '&amp;';
		case '<': return '&lt;';
		case '>': return '&gt;';
		case '"': return '&quot;';
		case "'": return '&#39;';
		default: return ch;
	}
}
