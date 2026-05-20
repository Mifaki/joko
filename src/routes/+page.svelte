<script lang="ts">
	import { onMount } from 'svelte';
	import JsonEditor from '$lib/components/JsonEditor.svelte';
	import { addToast } from '$lib/stores/toast';
	import { validateJson } from '$lib/utils/validator';
	import { formatJson, compactJson, byteSize, formatBytes } from '$lib/utils/formatter';
	import { examples } from '$lib/examples';
	import type { ParseError, WorkerResponse } from '$lib/types';

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
	let worker: Worker | null = null;
	let pending: string | null = null;
	let timer: ReturnType<typeof setTimeout>;

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
	function handleCompact() { navigator.clipboard.writeText(compactJson(formattedOutput)).then(() => addToast('Compact copied', 'success')).catch(() => addToast('Failed', 'error')); }
	function handleDownload() {
		const blob = new Blob([formattedOutput], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = Object.assign(document.createElement('a'), { href: url, download: 'output.json' });
		document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
		addToast('Downloaded', 'success');
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

<svelte:head>
	<title>Joko - JSON Formatter</title>
</svelte:head>

<svelte:window onclick={(e) => { if (!(e.target as Element)?.closest('.ex-wrap')) examplesOpen = false; }} />

<div class="app">
	<header class="header">
		<div class="brand">
			<div class="logomark">J</div>
			<span class="sitename">Joko</span>
			<span class="status" style="background:{si.color}18; color:{si.color}; border-color:{si.color}30;">
				<span class="dot" style="background:{si.color};"></span>
				{si.label}
			</span>
		</div>

		<div class="meta">
			{#if lineCount > 0}<span>{lineCount.toLocaleString()} lines · {sz}</span>{/if}
		</div>

		<div class="actions">
			<div class="indent">
				<button class:on={indentSize===2} onclick={() => changeIndent(2)}>2</button>
				<button class:on={indentSize===4} onclick={() => changeIndent(4)}>4</button>
			</div>
			<div class="ex-wrap">
				<button class="ghost" onclick={(e) => { e.stopPropagation(); examplesOpen = !examplesOpen; }}>
					Examples <span style="opacity:.5;font-size:10px;">▾</span>
				</button>
				{#if examplesOpen}
					<div class="dropdown">
						{#each examples as ex}
							<button onclick={() => loadEx(ex.content)}>
								<span class="el">{ex.label}</span>
								<span class="ed">{ex.description}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<button class="ghost" onclick={handleClear}>Clear</button>
			{#if hasOutput}
				<button class="ghost" onclick={handleCopy}>Copy</button>
				<button class="ghost" onclick={handleDownload}>Save</button>
			{/if}
			<button class="primary" onclick={() => { if (rawInput.trim()) processInput(rawInput); }}>Format</button>
		</div>
	</header>

	<main class="main">
		<div class="panel">
			<div class="pbar">
				<span class="plabel">Input</span>
				{#if lineCount > 0}<span class="pcount">{lineCount.toLocaleString()} lines</span>{/if}
			</div>
			<div class="ewrap">
				<JsonEditor value={rawInput} onchange={handleInput} showLint={true} placeholder="Paste or type JSON here…" />
			</div>
		</div>

		<div class="panel">
			<div class="pbar">
				<span class="plabel" style="color:{hasOutput?'#16a34a':'#9ca3af'}">Output</span>
				{#if hasOutput}
					<div style="display:flex;gap:4px;">
						<button class="pact" onclick={handleCopy}>Copy</button>
						<button class="pact" onclick={handleCompact}>Compact</button>
						<button class="pact" onclick={handleDownload}>Save</button>
					</div>
				{/if}
			</div>
			<div class="ewrap" style="position:relative;">
				{#if isProcessing}
					<div class="overlay"><div class="spinner"></div></div>
				{/if}
				{#if !hasOutput && !isProcessing}
					<div class="empty"><p>Formatted output will appear here</p></div>
				{/if}
				<JsonEditor value={formattedOutput} readonly={true} />
			</div>
		</div>
	</main>

	{#if errors.length > 0}
		<div class="errbar">
			<span class="errico">✕</span>
			{errors[0].message}
		</div>
	{/if}
</div>

<style>
	.app { display:flex; flex-direction:column; height:100vh; overflow:hidden; background:#F4F3F0; font-family:'Bricolage Grotesque',sans-serif; }

	.header { display:flex; align-items:center; gap:16px; padding:10px 20px; background:#fff; border-bottom:1px solid #ECEAE5; flex-shrink:0; }
	.brand { display:flex; align-items:center; gap:10px; flex-shrink:0; }
	.logomark { width:28px; height:28px; background:#FF3E00; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; font-weight:700; letter-spacing:-0.02em; }
	.sitename { font-size:15px; font-weight:700; color:#1A1917; letter-spacing:-0.02em; }
	.status { display:flex; align-items:center; gap:5px; padding:3px 9px; border-radius:100px; font-size:11px; font-weight:600; border:1px solid; }
	.dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
	.meta { flex:1; text-align:center; font-size:12px; color:#9ca3af; font-family:'JetBrains Mono',monospace; }
	.actions { display:flex; align-items:center; gap:6px; flex-shrink:0; }

	.indent { display:flex; border:1px solid #ECEAE5; border-radius:8px; overflow:hidden; font-family:'JetBrains Mono',monospace; font-size:12px; }
	.indent button { padding:5px 10px; background:transparent; border:none; cursor:pointer; color:#9ca3af; transition:all .12s; }
	.indent button.on { background:#FFF1EC; color:#FF3E00; font-weight:600; }
	.indent button:first-child { border-right:1px solid #ECEAE5; }

	.ex-wrap { position:relative; }
	.dropdown { position:absolute; right:0; top:calc(100% + 6px); background:#fff; border:1px solid #ECEAE5; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.1); min-width:200px; padding:4px; z-index:50; }
	.dropdown button { width:100%; text-align:left; padding:8px 12px; border:none; background:transparent; border-radius:8px; cursor:pointer; transition:background .1s; }
	.dropdown button:hover { background:#F4F3F0; }
	.el { display:block; font-size:13px; font-weight:600; color:#1A1917; }
	.ed { display:block; font-size:11px; color:#9ca3af; margin-top:1px; }

	.ghost { padding:6px 12px; border:1px solid #ECEAE5; border-radius:8px; background:transparent; color:#6b7280; font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:500; cursor:pointer; transition:all .12s; }
	.ghost:hover { border-color:#D1D5DB; color:#1A1917; background:#F9F8F6; }
	.primary { padding:6px 16px; border:none; border-radius:8px; background:#FF3E00; color:#fff; font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:background .12s; }
	.primary:hover { background:#D93400; }

	.main { flex:1; display:flex; gap:12px; padding:12px; overflow:hidden; min-height:0; }
	.panel { flex:1; display:flex; flex-direction:column; background:#fff; border-radius:12px; border:1px solid #ECEAE5; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.03); }
	.pbar { display:flex; align-items:center; justify-content:space-between; padding:8px 14px; border-bottom:1px solid #ECEAE5; background:#FAFAF8; flex-shrink:0; }
	.plabel { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#9ca3af; }
	.pcount { font-size:11px; color:#d1d5db; font-family:'JetBrains Mono',monospace; }
	.pact { padding:3px 8px; border:1px solid transparent; border-radius:6px; background:transparent; color:#6b7280; font-family:'Bricolage Grotesque',sans-serif; font-size:11px; font-weight:500; cursor:pointer; transition:all .1s; }
	.pact:hover { border-color:#ECEAE5; background:#F9F8F6; color:#374151; }
	.ewrap { flex:1; position:relative; overflow:hidden; min-height:0; }
	.overlay { position:absolute; inset:0; background:rgba(255,255,255,.85); display:flex; align-items:center; justify-content:center; z-index:10; }
	.spinner { width:24px; height:24px; border:2px solid #FFF1EC; border-top-color:#FF3E00; border-radius:50%; animation:spin .7s linear infinite; }
	@keyframes spin { to { transform:rotate(360deg); } }
	.empty { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
	.empty p { font-size:13px; color:#d1d5db; font-style:italic; }
	.errbar { display:flex; align-items:center; gap:8px; padding:10px 20px; background:#FEF2F2; border-top:1px solid #FECACA; color:#991B1B; font-size:12px; font-family:'JetBrains Mono',monospace; flex-shrink:0; }
	.errico { width:16px; height:16px; background:#DC2626; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; flex-shrink:0; }
</style>
