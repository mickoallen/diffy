import { load as loadStore } from '@tauri-apps/plugin-store';

export type Theme = 'void' | 'abyss' | 'chalk' | 'nate';
export type Font = 'system' | 'jetbrains' | 'fira' | 'ibm';
export type Scale = 'compact' | 'default' | 'relaxed' | 'large';

const SCALE_VALUES: Record<Scale, string> = {
	compact: '13px',
	default: '14px',
	relaxed: '15px',
	large: '16px'
};

class SettingsStore {
	theme = $state<Theme>('void');
	font = $state<Font>('system');
	scale = $state<Scale>('default');
	apiKey = $state('');
	showAiPanel = $state(false);
	showSettings = $state(false);
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
		try {
			const store = await loadStore('settings.json', { autoSave: false, defaults: {} });
			const theme = (await store.get<Theme>('theme')) ?? 'void';
			const font = (await store.get<Font>('font')) ?? 'system';
			const scale = (await store.get<Scale>('scale')) ?? 'default';
			const apiKey = (await store.get<string>('apiKey')) ?? '';

			this.theme = theme;
			this.font = font;
			this.scale = scale;
			this.apiKey = apiKey;

			this.applyTheme(theme);
			this.applyFont(font);
			this.applyScale(scale);
		} catch {
			// First run or store unavailable — apply defaults
			this.applyTheme(this.theme);
			this.applyFont(this.font);
			this.applyScale(this.scale);
		}
	}

	async save() {
		try {
			const store = await loadStore('settings.json', { autoSave: false, defaults: {} });
			await store.set('theme', this.theme);
			await store.set('font', this.font);
			await store.set('scale', this.scale);
			await store.set('apiKey', this.apiKey);
			await store.save();
		} catch {
			// Ignore save errors
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
