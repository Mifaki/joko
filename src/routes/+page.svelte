<script lang="ts">
	import { onMount } from 'svelte';
	import JsonEditor from '$lib/components/JsonEditor.svelte';
	import { addToast } from '$lib/stores/toast';
	import { validateJson } from '$lib/utils/validator';
	import { formatJson, compactJson, byteSize, formatBytes } from '$lib/utils/formatter';
	import { examples } from '$lib/examples';
	import type { ParseError, WorkerResponse } from '$lib/types';
	import { openSearchPanel } from '@codemirror/search';
	import { selectAll } from '@codemirror/commands';
	import type { EditorView } from '@codemirror/view';

	const WT = 100 * 1024;
	let rawInput = $state('');
	let formattedOutput = $state('');
	let status = $state<'idle' | 'valid' | 'invalid' | 'processing'>('idle');
	let errors = $state<ParseError[]>([]);
	let indentSize = $state<2 | 4>(2);
	let isProcessing = $state(false);
	let lineCount = $state(0);
	let currentByteSize = $state(0);
	let examplesOpen = $state(false);
	let outputFormatOpen = $state(false);
	let headerFormatOpen = $state(false);
	let worker: Worker | null = null;
	let pending: string | null = null;
	let timer: ReturnType<typeof setTimeout>;

	let inputView: EditorView | null = null;
	let outputView: EditorView | null = null;
	let activePanel: 'input' | 'output' = 'input';

	function handleGlobalKeydown(e: KeyboardEvent) {
		if (!(e.metaKey || e.ctrlKey)) return;
		if (e.key === 'f') {
			e.preventDefault();
			const view = activePanel === 'output' ? outputView : inputView;
			if (view) { view.focus(); openSearchPanel(view); }
		} else if (e.key === 'a' && activePanel === 'output' && outputView) {
			e.preventDefault();
			outputView.focus();
			selectAll(outputView);
		}
	}

	onMount(() => {
		import('$lib/workers/json.worker?worker').then((m) => {
			worker = new m.default();
			worker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
				const { id, type, success, result, error, errorDetails } = e.data;
				if (id !== pending) return;
				pending = null; isProcessing = false;
				if (type === 'format') {
					if (success && result) { formattedOutput = result; status = 'valid'; errors = []; }
					else { formattedOutput = ''; status = 'invalid'; errors = errorDetails ? [errorDetails] : [{ message: error ?? 'Unknown' }]; }
				}
			});
		}).catch(() => {});
		return () => worker?.terminate();
	});

	function handleInput(v: string) {
		rawInput = v; currentByteSize = byteSize(v); lineCount = v ? v.split('\n').length : 0;
		clearTimeout(timer);
		if (!v.trim()) { status = 'idle'; formattedOutput = ''; errors = []; isProcessing = false; return; }
		timer = setTimeout(() => processInput(v), currentByteSize > WT ? 500 : 120);
	}

	function processInput(v: string) {
		if (byteSize(v) > WT && worker) {
			isProcessing = true; status = 'processing';
			const id = `${Date.now()}`; pending = id;
			worker.postMessage({ id, type: 'format', payload: v, indent: indentSize });
		} else {
			try { formattedOutput = formatJson(v, indentSize); status = 'valid'; errors = []; }
			catch { const r = validateJson(v); formattedOutput = ''; status = 'invalid'; errors = r.error ? [r.error] : [{ message: 'Invalid JSON' }]; }
		}
	}

	function changeIndent(n: 2 | 4) { indentSize = n; if (rawInput.trim() && status === 'valid') processInput(rawInput); }
	function handleCopy() { navigator.clipboard.writeText(formattedOutput).then(() => addToast('Copied', 'success')).catch(() => addToast('Failed', 'error')); }
	function handleDownload() {
		const blob = new Blob([formattedOutput], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = Object.assign(document.createElement('a'), { href: url, download: 'output.json' });
		document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
		addToast('Downloaded', 'success');
	}
	
	function handleBeautifyOutput() { outputFormatOpen = false; if (rawInput.trim()) processInput(rawInput); }
	function handleCompactOutput() { outputFormatOpen = false; formattedOutput = compactJson(formattedOutput); addToast('Compacted', 'success'); }

	function handleCopyInput() { navigator.clipboard.writeText(rawInput).then(() => addToast('Copied', 'success')).catch(() => addToast('Failed', 'error')); }
	function handleDownloadInput() {
		const blob = new Blob([rawInput], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = Object.assign(document.createElement('a'), { href: url, download: 'input.json' });
		document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
		addToast('Downloaded', 'success');
	}

	function handleHeaderBeautify() { headerFormatOpen = false; if (rawInput.trim()) processInput(rawInput); }
	function handleHeaderCompact() {
		headerFormatOpen = false;
		if (!rawInput.trim()) return;
		try { formattedOutput = compactJson(rawInput); status = 'valid'; errors = []; }
		catch { const r = validateJson(rawInput); formattedOutput = ''; status = 'invalid'; errors = r.error ? [r.error] : [{ message: 'Invalid JSON' }]; }
	}

	function handleClear() { rawInput = ''; formattedOutput = ''; status = 'idle'; errors = []; lineCount = 0; currentByteSize = 0; isProcessing = false; }
	function loadEx(c: string) { handleInput(c); examplesOpen = false; }

	const hasOutput = $derived(formattedOutput.length > 0);
	const sz = $derived(formatBytes(currentByteSize));
	const si = $derived({
		label: ({ idle: 'Ready', valid: 'Valid', invalid: 'Invalid', processing: 'Processing…' } as Record<string,string>)[status],
		color: ({ idle: '#9ca3af', valid: '#16a34a', invalid: '#dc2626', processing: '#d97706' } as Record<string,string>)[status]
	});
</script>


<svelte:window onclick={(e) => {
	const t = e.target as Element;
	if (!t?.closest('.ex-wrap')) examplesOpen = false;
	if (!t?.closest('.output-format-wrap')) outputFormatOpen = false;
	if (!t?.closest('.header-format-wrap')) headerFormatOpen = false;
}} onkeydown={handleGlobalKeydown} />

<div class="flex flex-col h-screen overflow-hidden bg-[#F4F3F0] font-bricolage">
	<header class="flex items-center gap-4 px-5 py-[10px] bg-white border-b border-[#ECEAE5] shrink-0">
		<div class="flex items-center gap-[10px] shrink-0">
			<div class="w-7 h-7 bg-[#FF3E00] rounded-lg flex items-center justify-center text-white text-sm font-bold tracking-[-0.02em]">J</div>
			<span class="text-[15px] font-bold text-[#1A1917] tracking-[-0.02em]">Joko</span>
			<span class="flex items-center gap-[5px] px-[9px] py-[3px] rounded-full text-[11px] font-semibold border" style="background:{si.color}18; color:{si.color}; border-color:{si.color}30;">
				<span class="w-[5px] h-[5px] rounded-full shrink-0" style="background:{si.color};"></span>
				{si.label}
			</span>
		</div>

		<div class="flex-1 text-center text-xs text-[#9ca3af] font-mono">
			{#if lineCount > 0}
				<span>{lineCount.toLocaleString()} lines · {sz}</span>
			{:else}
				<span class="ml-[15%]">Free JSON formatter, validator &amp; beautifier</span>
			{/if}
		</div>

		<div class="flex items-center gap-[6px] shrink-0">
			<div class="flex border border-[#ECEAE5] rounded-lg overflow-hidden font-mono text-xs">
				<button
					class="px-[10px] py-[5px] border-0 border-r border-[#ECEAE5] cursor-pointer transition-all duration-[120ms] {indentSize === 2 ? 'bg-[#FFF1EC] text-[#FF3E00] font-semibold' : 'bg-transparent text-[#9ca3af]'}"
					onclick={() => changeIndent(2)}>2</button>
				<button
					class="px-[10px] py-[5px] border-0 cursor-pointer transition-all duration-[120ms] {indentSize === 4 ? 'bg-[#FFF1EC] text-[#FF3E00] font-semibold' : 'bg-transparent text-[#9ca3af]'}"
					onclick={() => changeIndent(4)}>4</button>
			</div>

			<div class="ex-wrap relative">
				<button
					class="px-3 py-[6px] border border-[#ECEAE5] rounded-lg bg-transparent text-[#6b7280] font-bricolage text-[13px] font-medium cursor-pointer transition-all duration-[120ms] hover:border-[#D1D5DB] hover:text-[#1A1917] hover:bg-[#F9F8F6]"
					onclick={(e) => { e.stopPropagation(); examplesOpen = !examplesOpen; }}>
					Examples <span class="opacity-50 text-[10px]">▾</span>
				</button>
				{#if examplesOpen}
					<div class="absolute right-0 top-[calc(100%+6px)] bg-white border border-[#ECEAE5] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] min-w-[200px] p-1 z-50">
						{#each examples as ex}
							<button
								class="w-full text-left px-3 py-2 border-0 bg-transparent rounded-lg cursor-pointer transition-colors duration-100 hover:bg-[#F4F3F0]"
								onclick={() => loadEx(ex.content)}>
								<span class="block text-[13px] font-semibold text-[#1A1917]">{ex.label}</span>
								<span class="block text-[11px] text-[#9ca3af] mt-px">{ex.description}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<button class="px-3 py-[6px] border border-[#ECEAE5] rounded-lg bg-transparent text-[#6b7280] font-bricolage text-[13px] font-medium cursor-pointer transition-all duration-[120ms] hover:border-[#D1D5DB] hover:text-[#1A1917] hover:bg-[#F9F8F6]" onclick={handleClear}>Clear</button>
			<div class="header-format-wrap relative">
				<button class="px-4 py-[6px] border-0 rounded-lg bg-[#FF3E00] text-white font-bricolage text-[13px] font-semibold cursor-pointer transition-colors duration-[120ms] hover:bg-[#D93400] flex items-center gap-[6px]"
					onclick={(e) => { e.stopPropagation(); headerFormatOpen = !headerFormatOpen; }}>
					Format <span class="opacity-70 text-[10px]">▾</span>
				</button>
				{#if headerFormatOpen}
					<div class="absolute right-0 top-[calc(100%+6px)] bg-white border border-[#ECEAE5] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] min-w-[160px] p-1 z-50">
						<button class="w-full text-left px-3 py-2 border-0 bg-transparent rounded-lg cursor-pointer transition-colors duration-100 hover:bg-[#F4F3F0]" onclick={handleHeaderBeautify}>
							<span class="block text-[13px] font-semibold text-[#1A1917]">Beautify</span>
							<span class="block text-[11px] text-[#9ca3af] mt-px">Pretty-print with indent</span>
						</button>
						<button class="w-full text-left px-3 py-2 border-0 bg-transparent rounded-lg cursor-pointer transition-colors duration-100 hover:bg-[#F4F3F0]" onclick={handleHeaderCompact}>
							<span class="block text-[13px] font-semibold text-[#1A1917]">Compact</span>
							<span class="block text-[11px] text-[#9ca3af] mt-px">Remove all whitespace</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<main class="flex-1 flex gap-3 p-3 overflow-hidden min-h-0">
		<div class="flex-1 flex flex-col bg-white rounded-xl border border-[#ECEAE5] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]" onmouseenter={() => activePanel = 'input'}>
			<div class="flex items-center justify-between px-[14px] py-2 border-b border-[#ECEAE5] bg-[#FAFAF8] shrink-0">
				<span class="text-[11px] font-bold tracking-[.08em] uppercase text-[#9ca3af]">Input</span>
				{#if rawInput.trim()}
					<div class="flex gap-1 items-center">
						<button class="px-2 py-[3px] border border-transparent rounded-md bg-transparent text-[#6b7280] font-bricolage text-[11px] font-medium cursor-pointer transition-all duration-100 hover:border-[#ECEAE5] hover:bg-[#F9F8F6] hover:text-[#374151]" onclick={handleCopyInput}>Copy</button>
						<button class="px-2 py-[3px] border border-transparent rounded-md bg-transparent text-[#6b7280] font-bricolage text-[11px] font-medium cursor-pointer transition-all duration-100 hover:border-[#ECEAE5] hover:bg-[#F9F8F6] hover:text-[#374151]" onclick={handleDownloadInput}>Save</button>
					</div>
				{/if}
			</div>
			<div class="flex-1 relative overflow-hidden min-h-0">
				<JsonEditor value={rawInput} onchange={handleInput} showLint={true} placeholder="Paste or type JSON here…" onviewready={(v) => inputView = v} />
			</div>
		</div>

		<div class="flex-1 flex flex-col bg-white rounded-xl border border-[#ECEAE5] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)]" onmouseenter={() => activePanel = 'output'}>
			<div class="flex items-center justify-between px-[14px] py-2 border-b border-[#ECEAE5] bg-[#FAFAF8] shrink-0">
				<span class="text-[11px] font-bold tracking-[.08em] uppercase" style="color:{hasOutput ? '#16a34a' : '#9ca3af'}">Output</span>
				{#if hasOutput}
					<div class="flex gap-1 items-center">
						<button class="px-2 py-[3px] border border-transparent rounded-md bg-transparent text-[#6b7280] font-bricolage text-[11px] font-medium cursor-pointer transition-all duration-100 hover:border-[#ECEAE5] hover:bg-[#F9F8F6] hover:text-[#374151]" onclick={handleCopy}>Copy</button>
						<div class="output-format-wrap relative">
							<button class="px-2 py-[3px] border border-transparent rounded-md bg-transparent text-[#6b7280] font-bricolage text-[11px] font-medium cursor-pointer transition-all duration-100 hover:border-[#ECEAE5] hover:bg-[#F9F8F6] hover:text-[#374151] flex items-center gap-[4px]"
								onclick={(e) => { e.stopPropagation(); outputFormatOpen = !outputFormatOpen; }}>
								Format <span class="opacity-50 text-[9px]">▾</span>
							</button>
							{#if outputFormatOpen}
								<div class="absolute right-0 top-[calc(100%+4px)] bg-white border border-[#ECEAE5] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.08)] min-w-[150px] p-1 z-50">
									<button class="w-full text-left px-3 py-[6px] border-0 bg-transparent rounded-md cursor-pointer transition-colors duration-100 hover:bg-[#F4F3F0]" onclick={handleBeautifyOutput}>
										<span class="block text-[12px] font-semibold text-[#1A1917]">Beautify</span>
										<span class="block text-[10px] text-[#9ca3af]">Pretty-print with indent</span>
									</button>
									<button class="w-full text-left px-3 py-[6px] border-0 bg-transparent rounded-md cursor-pointer transition-colors duration-100 hover:bg-[#F4F3F0]" onclick={handleCompactOutput}>
										<span class="block text-[12px] font-semibold text-[#1A1917]">Compact</span>
										<span class="block text-[10px] text-[#9ca3af]">Remove all whitespace</span>
									</button>
								</div>
							{/if}
						</div>
						<button class="px-2 py-[3px] border border-transparent rounded-md bg-transparent text-[#6b7280] font-bricolage text-[11px] font-medium cursor-pointer transition-all duration-100 hover:border-[#ECEAE5] hover:bg-[#F9F8F6] hover:text-[#374151]" onclick={handleDownload}>Save</button>
					</div>
				{/if}
			</div>
			<div class="flex-1 relative overflow-hidden min-h-0">
				{#if isProcessing}
					<div class="absolute inset-0 bg-white/85 flex items-center justify-center z-10">
						<div class="w-6 h-6 border-2 border-[#FFF1EC] border-t-[#FF3E00] rounded-full animate-[spin_0.7s_linear_infinite]"></div>
					</div>
				{/if}
				{#if !hasOutput && !isProcessing}
					<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
						<p class="text-[13px] text-[#d1d5db] italic">Formatted output will appear here</p>
					</div>
				{/if}
				<JsonEditor value={formattedOutput} readonly={true} onviewready={(v) => outputView = v} />
			</div>
		</div>
	</main>

	{#if errors.length > 0}
		<div class="flex items-center gap-2 px-5 py-[10px] bg-[#FEF2F2] border-t border-[#FECACA] text-[#991B1B] text-xs font-mono shrink-0">
			<span class="w-4 h-4 bg-[#DC2626] text-white rounded-full flex items-center justify-center text-[9px] font-bold shrink-0">✕</span>
			{errors[0].message}
		</div>
	{/if}
</div>
