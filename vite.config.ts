import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	worker: {
		format: 'es',
	},
	resolve: {
		dedupe: [
			'@codemirror/state',
			'@codemirror/view',
			'@codemirror/language',
			'@codemirror/lint',
			'@codemirror/search',
			'@codemirror/commands',
			'@codemirror/lang-json',
			'@lezer/highlight',
		],
	},
});
