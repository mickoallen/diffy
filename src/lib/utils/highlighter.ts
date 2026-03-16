import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki';

let highlighter: Highlighter | null = null;
const cache = new Map<string, string>();

export async function getHighlighter(): Promise<Highlighter> {
	if (!highlighter) {
		highlighter = await createHighlighter({
			themes: ['github-dark', 'github-light'],
			langs: [
				'javascript',
				'typescript',
				'python',
				'rust',
				'go',
				'java',
				'c',
				'cpp',
				'css',
				'html',
				'json',
				'yaml',
				'toml',
				'markdown',
				'bash',
				'sql',
				'svelte',
				'jsx',
				'tsx'
			]
		});
	}
	return highlighter;
}

function getLangFromPath(path: string): string {
	const ext = path.split('.').pop()?.toLowerCase() ?? '';
	const map: Record<string, string> = {
		js: 'javascript',
		mjs: 'javascript',
		cjs: 'javascript',
		ts: 'typescript',
		mts: 'typescript',
		cts: 'typescript',
		py: 'python',
		rs: 'rust',
		go: 'go',
		java: 'java',
		c: 'c',
		h: 'c',
		cpp: 'cpp',
		hpp: 'cpp',
		css: 'css',
		html: 'html',
		htm: 'html',
		json: 'json',
		yaml: 'yaml',
		yml: 'yaml',
		toml: 'toml',
		md: 'markdown',
		sh: 'bash',
		bash: 'bash',
		zsh: 'bash',
		sql: 'sql',
		svelte: 'svelte',
		jsx: 'jsx',
		tsx: 'tsx'
	};
	return map[ext] ?? 'text';
}

export async function highlightLine(
	content: string,
	filePath: string,
	theme: 'dark' | 'light'
): Promise<string> {
	const cacheKey = `${filePath}:${content}:${theme}`;
	if (cache.has(cacheKey)) return cache.get(cacheKey)!;

	const hl = await getHighlighter();
	const lang = getLangFromPath(filePath);
	const themeName = theme === 'dark' ? 'github-dark' : 'github-light';

	try {
		const tokens = hl.codeToTokens(content, { lang: lang as BundledLanguage, theme: themeName });
		const html = tokens.tokens[0]
			?.map((token) => {
				const escaped = token.content
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
				return `<span style="color:${token.color ?? ''}">${escaped}</span>`;
			})
			.join('');
		cache.set(cacheKey, html ?? content);
		return html ?? content;
	} catch {
		return content;
	}
}
