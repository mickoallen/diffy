import { load as loadStore } from '@tauri-apps/plugin-store';
import { toastStore } from './toast.svelte';

export type Theme = 'void' | 'abyss' | 'chalk' | 'nate';
export type Font = 'system' | 'jetbrains' | 'fira' | 'ibm';
export type Scale = 'compact' | 'default' | 'relaxed' | 'large';
export type AiProvider = 'claude' | 'openai' | 'gemini' | 'ollama' | 'lmstudio';

const SCALE_VALUES: Record<Scale, string> = {
	compact: '13px',
	default: '14px',
	relaxed: '15px',
	large: '16px'
};

function detectSystemTheme(): Theme {
	if (typeof window === 'undefined' || !window.matchMedia) return 'void';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'void' : 'chalk';
}

class SettingsStore {
	theme = $state<Theme>('void');
	font = $state<Font>('system');
	scale = $state<Scale>('default');
	aiApiKey = $state('');
	aiProvider = $state<AiProvider>('claude');
	aiModel = $state('claude-sonnet-4-6');
	aiBaseUrl = $state('http://localhost:11434');
	showAiPanel = $state(false);
	showSettings = $state(false);
	showShortcuts = $state(false);
	fileFilter = $state('');

	get isDark(): boolean {
		return this.theme === 'void' || this.theme === 'abyss';
	}

	applyTheme(t: Theme) {
		document.documentElement.setAttribute('data-theme', t);
	}

	applyFont(f: Font) {
		document.documentElement.setAttribute('data-font', f);
	}

	applyScale(s: Scale) {
		document.documentElement.style.fontSize = SCALE_VALUES[s];
	}

	setTheme(t: Theme) {
		this.theme = t;
		this.applyTheme(t);
		this.save();
	}

	setFont(f: Font) {
		this.font = f;
		this.applyFont(f);
		this.save();
	}

	setScale(s: Scale) {
		this.scale = s;
		this.applyScale(s);
		this.save();
	}

	async load() {
		let store;
		try {
			store = await loadStore('settings.json', { autoSave: false, defaults: {} });
		} catch (e) {
			// Plugin-store unavailable — apply defaults silently (first run or sandbox).
			this.applyDefaultsWithSystemTheme();
			console.error('Settings store unavailable:', e);
			return;
		}

		try {
			const hasExisting = await store.has('theme');
			const defaultTheme: Theme = hasExisting ? 'void' : detectSystemTheme();
			const theme = (await store.get<Theme>('theme')) ?? defaultTheme;
			const font = (await store.get<Font>('font')) ?? 'system';
			const scale = (await store.get<Scale>('scale')) ?? 'default';
			const aiApiKey = (await store.get<string>('aiApiKey')) ?? '';
			const aiProvider = (await store.get<AiProvider>('aiProvider')) ?? 'claude';
			const aiModel = (await store.get<string>('aiModel')) ?? 'claude-sonnet-4-6';
			const aiBaseUrl = (await store.get<string>('aiBaseUrl')) ?? 'http://localhost:11434';

			this.theme = theme;
			this.font = font;
			this.scale = scale;
			this.aiApiKey = aiApiKey;
			this.aiProvider = aiProvider;
			this.aiModel = aiModel;
			this.aiBaseUrl = aiBaseUrl;

			this.applyTheme(theme);
			this.applyFont(font);
			this.applyScale(scale);
		} catch (e) {
			this.applyDefaultsWithSystemTheme();
			toastStore.push(`Settings load failed: ${String(e)}`, 'error');
		}
	}

	private applyDefaultsWithSystemTheme() {
		this.theme = detectSystemTheme();
		this.applyTheme(this.theme);
		this.applyFont(this.font);
		this.applyScale(this.scale);
	}

	async save() {
		try {
			const store = await loadStore('settings.json', { autoSave: false, defaults: {} });
			await store.set('theme', this.theme);
			await store.set('font', this.font);
			await store.set('scale', this.scale);
			await store.set('aiApiKey', this.aiApiKey);
			await store.set('aiProvider', this.aiProvider);
			await store.set('aiModel', this.aiModel);
			await store.set('aiBaseUrl', this.aiBaseUrl);
			await store.save();
		} catch (e) {
			toastStore.push(`Settings save failed: ${String(e)}`, 'error');
		}
	}

	toggleAiPanel() {
		this.showAiPanel = !this.showAiPanel;
	}

	toggleSettings() {
		this.showSettings = !this.showSettings;
	}
}

export const settingsStore = new SettingsStore();
