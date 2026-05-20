<script lang="ts">
	import CheckCircle2 from 'lucide-svelte/icons/check-circle-2';
	import XCircle from 'lucide-svelte/icons/x-circle';
	import Info from 'lucide-svelte/icons/info';
	import X from 'lucide-svelte/icons/x';
	import { toasts, removeToast } from '$lib/stores/toast';

	const iconMap = {
		success: { Icon: CheckCircle2, color: '#16a34a' },
		error: { Icon: XCircle, color: '#dc2626' },
		info: { Icon: Info, color: '#2563eb' }
	};
</script>

<div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none" aria-live="assertive">
	{#each $toasts as toast (toast.id)}
		{@const { Icon, color } = iconMap[toast.type]}
		<div
			class="toast-enter flex items-center gap-3 px-4 py-3 rounded-xl pointer-events-auto"
			style="background:#fff; border:1px solid #e5e7eb; box-shadow:0 4px 16px rgba(0,0,0,0.1); min-width:200px; max-width:340px;"
			role="status"
		>
			<Icon size={15} {color} strokeWidth={2.5} />
			<span class="text-sm flex-1" style="color:#111827; font-family:'Figtree',sans-serif;">{toast.message}</span>
			<button
				onclick={() => removeToast(toast.id)}
				class="shrink-0 transition-opacity opacity-40 hover:opacity-100"
				style="color:#6b7280;"
				aria-label="Dismiss"
			>
				<X size={13} strokeWidth={2} />
			</button>
		</div>
	{/each}
</div>
