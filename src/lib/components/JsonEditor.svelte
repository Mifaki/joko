<script lang="ts">
	import { onMount } from 'svelte';
	import { EditorState } from '@codemirror/state';
	import {
		EditorView,
		placeholder as cmPlaceholder,
		keymap,
		lineNumbers,
		highlightActiveLine,
		highlightActiveLineGutter,
		drawSelection,
		dropCursor
	} from '@codemirror/view';
	import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
	import {
		bracketMatching,
		foldGutter,
		foldKeymap,
		indentOnInput,
		syntaxHighlighting,
		HighlightStyle
	} from '@codemirror/language';
	import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
	import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
	import { json } from '@codemirror/lang-json';
	import { tags } from '@lezer/highlight';

	interface Props {
		value?: string;
		onchange?: (value: string) => void;
		readonly?: boolean;
		showLint?: boolean;
		placeholder?: string;
	}

	let { value = '', onchange, readonly = false, showLint = false, placeholder = '' }: Props =
		$props();

	let container: HTMLDivElement;
	// $state.raw avoids deep-proxying the EditorView, which would break CM's instanceof checks.
	let view = $state.raw<EditorView | null>(null);
	let parentInitiated = false;
	let scrollRaf = 0;

	const forgeTheme = EditorView.theme(
		{
			'&': { backgroundColor: 'transparent', height: '100%' },
			'.cm-scroller': {
				fontFamily: '"JetBrains Mono", "Fira Code", monospace',
				fontSize: '13.5px',
				lineHeight: '1.65',
				overflow: 'auto'
			},
			'.cm-content': {
				caretColor: '#2563EB',
				padding: '12px 0',
				minHeight: '100%'
			},
			'.cm-focused': { outline: 'none !important' },
			'.cm-cursor, .cm-dropCursor': {
				borderLeftColor: '#2563EB',
				borderLeftWidth: '2px'
			},
			'.cm-selectionBackground': {
				backgroundColor: 'rgba(37, 99, 235, 0.12) !important'
			},
			'&.cm-focused .cm-selectionBackground': {
				backgroundColor: 'rgba(37, 99, 235, 0.16) !important'
			},
			'.cm-gutters': {
				backgroundColor: '#F8FAFC',
				borderRight: '1px solid #E2E8F0',
				color: '#94A3B8',
				userSelect: 'none',
				minWidth: '44px'
			},
			'.cm-gutterElement': { paddingLeft: '6px', paddingRight: '10px' },
			'.cm-activeLineGutter': {
				backgroundColor: '#EFF6FF',
				color: '#64748B'
			},
			'.cm-activeLine': { backgroundColor: 'rgba(37, 99, 235, 0.03)' },
			'.cm-foldGutter .cm-gutterElement': { fontSize: '11px', paddingRight: '4px' },
			'.cm-foldPlaceholder': {
				backgroundColor: 'rgba(37, 99, 235, 0.08)',
				border: '1px solid rgba(37, 99, 235, 0.2)',
				borderRadius: '3px',
				color: '#2563EB',
				padding: '0 6px',
				cursor: 'pointer'
			},
			'.cm-matchingBracket': {
				backgroundColor: 'rgba(37, 99, 235, 0.1)',
				borderRadius: '2px',
				outline: '1px solid rgba(37, 99, 235, 0.3)'
			},
			'.cm-nonmatchingBracket': {
				backgroundColor: 'rgba(220, 38, 38, 0.1)',
				borderRadius: '2px',
				outline: '1px solid rgba(220, 38, 38, 0.3)'
			},
			'.cm-lintRange-error': {
				backgroundImage: 'none',
				textDecoration: 'underline wavy #dc2626',
				textUnderlineOffset: '3px'
			},
			'.cm-tooltip.cm-tooltip-lint': {
				backgroundColor: '#FFFFFF',
				border: '1px solid #FCA5A5',
				borderRadius: '8px',
				padding: '8px 12px',
				color: '#991B1B',
				fontSize: '12px',
				fontFamily: '"JetBrains Mono", monospace',
				boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
				maxWidth: '340px'
			},
			'.cm-lint-marker-error': { color: '#dc2626' },
			'.cm-searchMatch': {
				backgroundColor: 'rgba(37, 99, 235, 0.15)',
				outline: '1px solid rgba(37, 99, 235, 0.3)',
				borderRadius: '2px'
			},
			'.cm-searchMatch.cm-searchMatch-selected': {
				backgroundColor: 'rgba(37, 99, 235, 0.3)'
			},
			'.cm-selectionMatch': { backgroundColor: 'rgba(234, 179, 8, 0.15)' },
			'.cm-placeholder': { color: '#9CA3AF', fontStyle: 'italic' },
			'.cm-panels': {
				backgroundColor: '#F8FAFC',
				borderTop: '1px solid #E2E8F0',
				color: '#374151'
			},
			'.cm-textfield': {
				backgroundColor: '#FFFFFF',
				border: '1px solid #D1D5DB',
				borderRadius: '4px',
				color: '#111827',
				padding: '2px 6px'
			},
			'.cm-button': {
				backgroundColor: '#FFFFFF',
				border: '1px solid #D1D5DB',
				borderRadius: '4px',
				color: '#374151',
				cursor: 'pointer'
			}
		},
		{ dark: false }
	);

	const forgeHighlight = HighlightStyle.define([
		{ tag: tags.string, color: '#16A34A' },
		{ tag: tags.number, color: '#D97706' },
		{ tag: tags.bool, color: '#7C3AED' },
		{ tag: tags.null, color: '#6B7280' },
		{ tag: tags.propertyName, color: '#1D4ED8' },
		{ tag: tags.punctuation, color: '#9CA3AF' },
		{ tag: tags.bracket, color: '#374151' },
		{ tag: tags.squareBracket, color: '#374151' },
		{ tag: tags.brace, color: '#374151' },
		{ tag: tags.invalid, color: '#DC2626', textDecoration: 'underline' }
	]);

	function jsonLinterFn(editorView: EditorView): Diagnostic[] {
		const text = editorView.state.doc.toString();
		if (!text.trim()) return [];
		try {
			JSON.parse(text);
			return [];
		} catch (err) {
			const error = err as SyntaxError;
			let from = 0;
			let to = Math.max(1, text.length);
			const m = error.message.match(/\bat\s+position\s+(\d+)/i);
			if (m) {
				from = Math.min(parseInt(m[1], 10), text.length - 1);
				to = Math.min(from + 1, text.length);
			}
			return [{ from, to, severity: 'error', message: error.message.replace(/^SyntaxError:\s*/i, '').trim() }];
		}
	}

	function buildExtensions() {
		const base = [
			lineNumbers(),
			highlightActiveLineGutter(),
			highlightActiveLine(),
			history(),
			foldGutter(),
			drawSelection(),
			dropCursor(),
			bracketMatching(),
			highlightSelectionMatches(),
			indentOnInput(),
			json(),
			forgeTheme,
			syntaxHighlighting(forgeHighlight),
			keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap, ...foldKeymap, indentWithTab]),
			EditorView.editable.of(!readonly),
			EditorState.readOnly.of(readonly)
		];

		if (placeholder) base.push(cmPlaceholder(placeholder));

		if (!readonly) {
			base.push(
				linter(jsonLinterFn, { delay: 400 }),
				EditorView.updateListener.of((update) => {
					if (update.docChanged && !parentInitiated) {
						onchange?.(update.state.doc.toString());
					}
				})
			);
			if (showLint) base.push(lintGutter());
		}

		return base;
	}

	onMount(() => {
		view = new EditorView({
			state: EditorState.create({ doc: value, extensions: buildExtensions() }),
			parent: container
		});
		return () => {
			view?.destroy();
			view = null;
		};
	});

	$effect(() => {
		const incoming = value;
		if (!view) return;
		const doc = view.state.doc.toString();
		if (doc === incoming) return;

		const scrollTop = view.scrollDOM.scrollTop;
		parentInitiated = true;
		view.dispatch({ changes: { from: 0, to: doc.length, insert: incoming } });
		parentInitiated = false;

		// CM schedules its scroll-into-view inside a rAF during dispatch().
		// Queuing our restore after it ensures we win without a visible flash.
		cancelAnimationFrame(scrollRaf);
		scrollRaf = requestAnimationFrame(() => {
			if (view) view.scrollDOM.scrollTop = scrollTop;
		});
	});
</script>

<div bind:this={container} style="position:absolute; inset:0; overflow:hidden;"></div>
