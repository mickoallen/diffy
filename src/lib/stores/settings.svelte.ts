class SettingsStore {
	theme = $state<'dark' | 'light'>('dark');
	apiKey = $state('');
	showAiPanel = $state(false);
	showSettings = $state(false);
	fileFilter = $state('');

	toggleTheme() {
		this.theme = this.theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', this.theme);
	}

	toggleAiPanel() {
		this.showAiPanel = !this.showAiPanel;
	}

	toggleSettings() {
		this.showSettings = !this.showSettings;
	}
}

export const settingsStore = new SettingsStore();
