import { writable } from 'svelte/store';
import type { Toast, ToastType } from '$lib/types';

export const toasts = writable<Toast[]>([]);

let counter = 0;

export function addToast(message: string, type: ToastType = 'success', duration = 3000) {
	const id = `toast-${++counter}`;
	toasts.update((t) => [...t, { id, type, message }]);

	if (duration > 0) {
		setTimeout(() => removeToast(id), duration);
	}

	return id;
}

export function removeToast(id: string) {
	toasts.update((t) => t.filter((toast) => toast.id !== id));
}
