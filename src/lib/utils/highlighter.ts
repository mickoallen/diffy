import { createHighlighter, type Highlighter, type BundledLanguage } from 'shiki';

let highlighter: Highlighter | null = null;
const LRU_MAX = 2000;
const cache = new Map<string, string>();

function cacheSet(key: string, value: string) {
	if (cache.size >= LRU_MAX) {
		const oldest = cache.keys().next().value!;
		cache.delete(oldest);
	}
	cache.set(key, value);
}

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
				'tsx',
				'ruby',
				'php',
				'swift',
				'kotlin',
				'csharp',
				'scala',
				'haskell',
				'lua',
				'perl',
				'r',
				'dart',
				'elixir',
				'erlang',
				'clojure',
				'ocaml',
				'fsharp',

				'hcl',
				'nix',
				'make',
				'ini',
				'xml',
				'vue',
				'graphql',
				'scss',
				'less',
				'handlebars'
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
		tsx: 'tsx',
		rb: 'ruby',
		ruby: 'ruby',
		php: 'php',
		swift: 'swift',
		kt: 'kotlin',
		kts: 'kotlin',
		cs: 'csharp',
		scala: 'scala',
		hs: 'haskell',
		lua: 'lua',
		pl: 'perl',
		pm: 'perl',
		r: 'r',
		dart: 'dart',
		ex: 'elixir',
		exs: 'elixir',
		erl: 'erlang',
		clj: 'clojure',
		cljs: 'clojure',
		ml: 'ocaml',
		mli: 'ocaml',
		fs: 'fsharp',
		fsx: 'fsharp',

		tf: 'hcl',
		hcl: 'hcl',
		tfvars: 'hcl',
		nix: 'nix',
		mk: 'make',
		ini: 'ini',
		cfg: 'ini',
		xml: 'xml',
		vue: 'vue',
		graphql: 'graphql',
		gql: 'graphql',
		scss: 'scss',
		less: 'less',
		hbs: 'handlebars'
	};
	return map[ext] ?? 'text';
}

export async function highlightLines(
	lines: string[],
	filePath: string,
	theme: 'dark' | 'light'
): Promise<string[]> {
	const hl = await getHighlighter();
	const lang = getLangFromPath(filePath);
	const themeName = theme === 'dark' ? 'github-dark' : 'github-light';
	return lines.map((content) => {
		const cacheKey = `${filePath}:${content}:${theme}`;
		if (cache.has(cacheKey)) return cache.get(cacheKey)!;
		try {
			const tokens = hl.codeToTokens(content, { lang: lang as BundledLanguage, theme: themeName });
			const html = tokens.tokens[0]
				?.map((t) => {
					const esc = t.content
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;');
					return `<span style="color:${t.color ?? ''}">${esc}</span>`;
				})
				.join('');
			cacheSet(cacheKey, html ?? content);
			return html ?? content;
		} catch {
			return content;
		}
	});
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
		cacheSet(cacheKey, html ?? content);
		return html ?? content;
	} catch {
		return content;
	}
}
