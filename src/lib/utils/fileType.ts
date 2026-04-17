const IMAGE_EXTS = new Set([
	'png',
	'jpg',
	'jpeg',
	'gif',
	'webp',
	'svg',
	'bmp',
	'ico',
	'avif'
]);

export type FileCategory =
	| 'script'
	| 'style'
	| 'markup'
	| 'config'
	| 'data'
	| 'image'
	| 'doc'
	| 'other';

const SCRIPT_EXTS = new Set([
	'ts',
	'tsx',
	'js',
	'jsx',
	'mjs',
	'cjs',
	'rs',
	'go',
	'py',
	'rb',
	'java',
	'kt',
	'swift',
	'c',
	'cpp',
	'h',
	'hpp',
	'sh',
	'bash',
	'zsh'
]);

const STYLE_EXTS = new Set(['css', 'scss', 'sass', 'less', 'styl']);

const MARKUP_EXTS = new Set(['html', 'htm', 'svelte', 'vue', 'xml', 'astro']);

const CONFIG_EXTS = new Set(['json', 'toml', 'yaml', 'yml', 'ini', 'env', 'lock', 'conf']);

const DATA_EXTS = new Set(['csv', 'tsv', 'sql', 'parquet', 'db']);

const DOC_EXTS = new Set(['md', 'mdx', 'txt', 'rst', 'pdf']);

const CONFIG_FILENAMES = new Set([
	'dockerfile',
	'makefile',
	'.gitignore',
	'.editorconfig',
	'.env'
]);

function getBasename(path: string): string {
	const slash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
	return (slash === -1 ? path : path.slice(slash + 1)).toLowerCase();
}

export function getExtension(path: string): string {
	const idx = path.lastIndexOf('.');
	if (idx === -1) return '';
	return path.slice(idx + 1).toLowerCase();
}

export function isImageFile(path: string | null | undefined): boolean {
	if (!path) return false;
	return IMAGE_EXTS.has(getExtension(path));
}

export function getFileCategory(path: string | null | undefined): FileCategory {
	if (!path) return 'other';
	const base = getBasename(path);
	if (CONFIG_FILENAMES.has(base)) return 'config';
	const ext = getExtension(base);
	if (!ext) return 'other';
	if (SCRIPT_EXTS.has(ext)) return 'script';
	if (STYLE_EXTS.has(ext)) return 'style';
	if (MARKUP_EXTS.has(ext)) return 'markup';
	if (CONFIG_EXTS.has(ext)) return 'config';
	if (DATA_EXTS.has(ext)) return 'data';
	if (IMAGE_EXTS.has(ext)) return 'image';
	if (DOC_EXTS.has(ext)) return 'doc';
	return 'other';
}
