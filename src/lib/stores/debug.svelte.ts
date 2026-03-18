export interface DebugEntry {
	level: 'log' | 'warn' | 'error' | 'rejection';
	message: string;
	time: string;
}

class DebugStore {
	entries = $state<DebugEntry[]>([]);
	show = $state(false);

	private fmt() {
		return new Date().toISOString().slice(11, 23);
	}

	push(level: DebugEntry['level'], message: string) {
		this.entries = [{ level, message, time: this.fmt() }, ...this.entries].slice(0, 200);
	}

	clear() {
		this.entries = [];
	}

	toggle() {
		this.show = !this.show;
	}

	install() {
		const origError = console.error.bind(console);
		const origWarn = console.warn.bind(console);
		const origLog = console.log.bind(console);

		console.error = (...args) => {
			this.push('error', args.map(String).join(' '));
			origError(...args);
		};
		console.warn = (...args) => {
			this.push('warn', args.map(String).join(' '));
			origWarn(...args);
		};
		console.log = (...args) => {
			this.push('log', args.map(String).join(' '));
			origLog(...args);
		};

		window.addEventListener('unhandledrejection', (e) => {
			this.push('rejection', String(e.reason));
		});

		window.addEventListener('error', (e) => {
			this.push('error', `${e.message} (${e.filename}:${e.lineno})`);
		});
	}
}

export const debugStore = new DebugStore();
