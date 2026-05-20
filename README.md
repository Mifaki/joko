# Joko - JSON Formatter

Joko is a JSON formatter and validator. It handles big files without locking the browser, shows you exactly where your JSON broke, and gets out of your way.

---

## What it does

- Formats and validates JSON as you type
- Syntax highlighting 
- Error detection with line/column info and suggestions
- Minify to compact JSON — copy it directly
- Download as `.json`
- Files under 100KB process on the main thread (faster). Anything above goes to a Web Worker so the UI stays responsive

## Tech

- SvelteKit 2 / Svelte 5 (Runes)
- TypeScript
- CodeMirror 6
- Web Workers via Vite's `?worker` import

---

## Getting started

**Requirements:** Node.js 18+ (or pnpm / Bun)

```bash
git clone https://github.com/your-username/joko.git
cd joko
npm install
npm run dev
```

Open `http://localhost:5173`.

```bash
# Type checking
npm run check

# Production build
npm run build

# Preview the build locally
npm run preview
```

---

## Project structure

```
src/
├── app.html                    # HTML shell — SEO meta, Google Fonts
├── app.css                     # Tailwind v4 theme
├── lib/
│   ├── types.ts                # Shared TypeScript types
│   ├── components/
│   │   ├── JsonEditor.svelte   # CodeMirror 6 wrapper
│   │   ├── Toolbar.svelte      # Header — status indicator, actions
│   │   ├── ErrorPanel.svelte   # Error + suggestion display
│   │   └── Toast.svelte        # Notification overlay
│   ├── workers/
│   │   └── json.worker.ts      # Web Worker: format / compact / validate
│   ├── utils/
│   │   ├── formatter.ts        # formatJson, compactJson, byteSize, formatBytes
│   │   └── validator.ts        # validateJson, error position extraction, suggestions
│   └── stores/
│       └── toast.ts            # Toast state
└── routes/
    ├── +layout.svelte
    ├── +page.svelte            # Main app
    └── +page.ts
```

---

## Performance

The 100KB threshold is where synchronous `JSON.parse` starts to feel slow on average hardware. Below it, processing is instant. Above it, the Worker takes over and the spinner shows while it runs in the background the editor stays interactive the whole time.

Debounce delays: 120ms under 100KB, 500ms above. This prevents hammering the parser on every keystroke when editing large files.

CodeMirror's virtual document model means the output panel never actually renders all lines to the DOM. Rendering a 500K-line result is as fast as rendering 100 lines.


---

## Editor shortcuts

| Action | Shortcut |
|--------|----------|
| Undo | `Ctrl/Cmd + Z` |
| Redo | `Ctrl/Cmd + Shift + Z` |
| Find | `Ctrl/Cmd + F` |
| Fold block | `Ctrl/Cmd + Shift + [` |
| Unfold block | `Ctrl/Cmd + Shift + ]` |
 
---