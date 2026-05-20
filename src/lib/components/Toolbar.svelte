<script lang="ts">
	import Zap from 'lucide-svelte/icons/zap';
	import RotateCcw from 'lucide-svelte/icons/rotate-ccw';
	import Play from 'lucide-svelte/icons/play';
	import Copy from 'lucide-svelte/icons/copy';
	import Download from 'lucide-svelte/icons/download';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import { examples } from '$lib/examples';

	interface Props {
		status: 'idle' | 'valid' | 'invalid' | 'processing';
		lineCount: number;
		byteSize: string;
		indentSize: 2 | 4;
		hasOutput: boolean;
		onLoadExample: (content: string) => void;
		onClear: () => void;
		onFormat: () => void;
		onCopyFormatted: () => void;
		onDownload: () => void;
		onIndentChange: (size: 2 | 4) => void;
	}

	let {
		status,
		lineCount,
		byteSize,
		indentSize,
		hasOutput,
		onLoadExample,
		onClear,
		onFormat,
		onCopyFormatted,
		onDownload,
		onIndentChange
	}: Props = $props();

	let examplesOpen = $state(false);

	const statusMap = {
		idle: { label: 'Ready', color: '#9CA3AF', dot: '#D1D5DB' },
		valid: { label: 'Valid', color: '#16A34A', dot: '#16A34A' },
		invalid: { label: 'Invalid', color: '#DC2626', dot: '#DC2626' },
		processing: { label: 'Processing…', color: '#D97706', dot: '#D97706' }
	};

	const cur = $derived(statusMap[status]);

	function loadExample(content: string) {
		onLoadExample(content);
		examplesOpen = false;
	}
</script>

<svelte:window onclick={(e) => {
	if (!(e.target as Element)?.closest('.examples-dropdown')) examplesOpen = false;
}} />

<header class="flex items-center gap-3 px-4 py-2.5 border-b" style="background:#fff; border-color:#e5e7eb;">

	<div class="flex items-center gap-2 shrink-0">
		<div class="flex items-center justify-center w-7 h-7 rounded-lg" style="background:#eff6ff; border:1px solid #bfdbfe;">
			<Zap size={14} color="#2563eb" strokeWidth={2.5} />
		</div>
		<span class="text-sm font-bold tracking-wide" style="font-family:'Figtree',sans-serif; color:#111827; letter-spacing:0.04em;">
			Joko
		</span>
	</div>

	<div style="width:1px; height:20px; background:#e5e7eb;" class="hidden sm:block"></div>

	<div class="hidden sm:flex items-center gap-3 text-xs" style="font-family:'JetBrains Mono',monospace;">
		<span class="flex items-center gap-1.5">
			<span class="w-1.5 h-1.5 rounded-full {status === 'idle' ? '' : 'pulse-dot'}" style="background:{cur.dot};"></span>
			<span style="color:{cur.color};">{cur.label}</span>
		</span>
		{#if lineCount > 0}
			<span style="color:#9ca3af;">{lineCount.toLocaleString()} lines · {byteSize}</span>
		{/if}
	</div>

	<div class="flex-1"></div>

	<div class="flex items-center gap-1.5">
		<div class="hidden md:flex items-center rounded-lg overflow-hidden text-xs" style="border:1px solid #e5e7eb; font-family:'JetBrains Mono',monospace;">
			<button
				onclick={() => onIndentChange(2)}
				class="px-2.5 py-1.5 transition-colors"
				style="color:{indentSize===2?'#2563eb':'#6b7280'}; background:{indentSize===2?'#eff6ff':'transparent'};"
				aria-pressed={indentSize === 2}
				aria-label="2-space indent"
			>2</button>
			<div style="width:1px;height:20px;background:#e5e7eb;"></div>
			<button
				onclick={() => onIndentChange(4)}
				class="px-2.5 py-1.5 transition-colors"
				style="color:{indentSize===4?'#2563eb':'#6b7280'}; background:{indentSize===4?'#eff6ff':'transparent'};"
				aria-pressed={indentSize === 4}
				aria-label="4-space indent"
			>4</button>
		</div>
		<div class="relative examples-dropdown">
			<button
				onclick={(e) => { e.stopPropagation(); examplesOpen = !examplesOpen; }}
				class="tbtn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
				aria-haspopup="listbox"
				aria-expanded={examplesOpen}
			>
				<span>Examples</span>
				<ChevronDown size={12} strokeWidth={2} />
			</button>

			{#if examplesOpen}
				<div
					class="absolute right-0 top-full mt-1 rounded-xl py-1 z-50"
					style="background:#fff; border:1px solid #e5e7eb; box-shadow:0 8px 24px rgba(0,0,0,0.1); min-width:200px;"
					role="listbox"
				>
					{#each examples as ex}
						<button
							onclick={() => loadExample(ex.content)}
							class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
							role="option"
							aria-selected="false"
						>
							<div class="font-medium" style="color:#111827; font-family:'Figtree',sans-serif;">{ex.label}</div>
							<div class="text-xs mt-0.5" style="color:#9ca3af; font-family:'Figtree',sans-serif;">{ex.description}</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
		<button onclick={onClear} class="tbtn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" aria-label="Clear">
			<RotateCcw size={13} strokeWidth={2} />
			<span class="hidden sm:inline">Clear</span>
		</button>
		{#if hasOutput}
			<button onclick={onCopyFormatted} class="tbtn hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" aria-label="Copy formatted">
				<Copy size={13} strokeWidth={2} />
				<span class="hidden md:inline">Copy</span>
			</button>
			<button onclick={onDownload} class="tbtn hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" aria-label="Download">
				<Download size={13} strokeWidth={2} />
				<span class="hidden lg:inline">Save</span>
			</button>
		{/if}
		<button
			onclick={onFormat}
			class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
			style="background:#2563eb; color:#fff; font-family:'Figtree',sans-serif;"
			aria-label="Format JSON"
		>
			<Play size={13} strokeWidth={2.5} />
			<span>Format</span>
		</button>
	</div>
</header>

<style>
	.tbtn {
		color: #6b7280;
		border: 1px solid #e5e7eb;
		background: transparent;
		font-family: 'Figtree', sans-serif;
		transition: all 0.12s;
	}
	.tbtn:hover {
		color: #374151;
		border-color: #d1d5db;
		background: #f9fafb;
	}
</style>
