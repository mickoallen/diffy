export type ToastKind = 'error' | 'info';

export interface Toast {
	id: number;
	kind: ToastKind;
	message: string;
}

const AUTO_DISMISS_MS = 5000;

class ToastStore {
	toasts = $state<Toast[]>([]);
	private nextId = 1;

	push(message: string, kind: ToastKind = 'info') {
		const id = this.nextId++;
		this.toasts = [...this.toasts, { id, kind, message }];
		setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
	}

	dismiss(id: number) {
		this.toasts = this.toasts.filter(t => t.id !== id);
	}
}

export const toastStore = new ToastStore();
