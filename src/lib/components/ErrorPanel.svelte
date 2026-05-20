<script lang="ts">
	import AlertTriangle from 'lucide-svelte/icons/alert-triangle';
	import Lightbulb from 'lucide-svelte/icons/lightbulb';
	import X from 'lucide-svelte/icons/x';
	import type { ParseError } from '$lib/types';

	interface Props {
		errors: ParseError[];
		suggestions: string[];
		onDismiss?: () => void;
	}

	let { errors, suggestions, onDismiss }: Props = $props();
	const primary = $derived(errors[0]);
</script>

<div
	class="slide-up border-t px-4 py-3 flex items-start justify-between gap-3"
	style="background:#fef9f0; border-color:#fde68a;"
	role="alert"
	aria-live="polite"
>
	<div class="flex flex-col gap-1.5 min-w-0 flex-1">
		{#if primary}
			<div class="flex items-start gap-2">
				<AlertTriangle size={13} color="#d97706" strokeWidth={2.5} class="shrink-0 mt-0.5" />
				<span class="text-xs break-words" style="color:#92400e; font-family:'JetBrains Mono',monospace;">
					{primary.message}{primary.line ? ` — line ${primary.line}${primary.column ? `, col ${primary.column}` : ''}` : ''}
				</span>
			</div>
		{/if}

		{#each suggestions as tip}
			<div class="flex items-start gap-2">
				<Lightbulb size={12} color="#2563eb" strokeWidth={2} class="shrink-0 mt-0.5" />
				<span class="text-xs" style="color:#1e40af; font-family:'Figtree',sans-serif; line-height:1.5;">
					{tip}
				</span>
			</div>
		{/each}
	</div>

	{#if onDismiss}
		<button
			onclick={onDismiss}
			class="shrink-0 p-1 rounded transition-colors hover:bg-amber-100"
			style="color:#92400e;"
			aria-label="Dismiss"
		>
			<X size={13} strokeWidth={2} />
		</button>
	{/if}
</div>
