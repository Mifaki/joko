<script lang="ts">
	import { page } from '$app/stores';
	const routes = ['a', 'b', 'c', 'd', 'e', 'f'];
</script>

<nav class="enav">
	<a href="/" class="home" title="Main app">J</a>
	<div class="divider"></div>
	{#each routes as r}
		<a href="/{r}" class:active={$page.url.pathname === `/${r}`}>{r}</a>
	{/each}
</nav>

<style>
	.enav {
		position: fixed;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 2px;
		background: rgba(15, 15, 15, 0.88);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: 100px;
		padding: 4px;
		z-index: 9999;
		box-shadow: 0 4px 32px rgba(0,0,0,0.28), 0 1px 0 rgba(255,255,255,0.06) inset;
	}
	a {
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 100px;
		text-decoration: none;
		color: rgba(255,255,255,0.45);
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		transition: all 0.13s;
	}
	a:hover:not(.active):not(.home) { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.1); }
	a.active { background: #fff; color: #111; }
	a.home { color: rgba(255,255,255,0.3); font-size: 13px; font-weight: 700; letter-spacing: 0; }
	a.home:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.08); }
	.divider { width: 1px; height: 16px; background: rgba(255,255,255,0.12); margin: 0 2px; }
</style>
