# Design

<!-- impeccable:design-schema 1 -->

## Surface

`frontend/src/app/page.tsx` + components — the Lumen chat and document intelligence interface.

## Mode

Operate & Synthesize. The user interacts with complex document corpora: uploading files, inspecting visual evidence, asking both high-level synthesis questions and pinpoint analytical queries, and managing multi-turn conversation threads.

## Visual World

Modern SaaS Glassmorphism (the "Lumen" Glass Studio).
Edge-to-edge docked interface with clean hairline borders, frosted glass surfaces, and responsive padding. The design eliminates visual clutter:
- **Theme Palette**: Dark-first (`#000000` ground with soft ambient glow) alongside a full Light mode re-theme (`theme-light`), toggleable pre-paint with zero screen flicker.
- **Brand Gradient**: Violet (`#8b7cf6`) → Cyan (`#4cc9f0`) → Green (`#5ae0a0`) used intentionally for identity, primary buttons, and assistant mark.
- **Hairline Partitions**: Modern 1px borders (`border-hairline`) provide structure without heavy divider bars.

## Palette & Design Tokens

| Role | Token | Value (Dark) | Value (Light) |
|---|---|---|---|
| Background Ground | `--bg-base` | `#05070f` | `#f8fafc` |
| Panel / Header Surface | `--panel-surface` | `rgba(13, 17, 28, 0.75)` | `rgba(255, 255, 255, 0.85)` |
| Card Surface | `--card-surface` | `rgba(18, 24, 38, 0.70)` | `rgba(255, 255, 255, 0.95)` |
| Hairline Border | `--glass-line` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.08)` |
| Heading Text | `--text-heading` | `#f1f5f9` | `#0f172a` |
| Primary Ink | `--ink` | `#cbd5e1` | `#334155` |
| Dimmed Ink | `--ink-dim` | `#64748b` | `#94a3b8` |
| Active Accent | `thermo` | `#38bdf8` | `#0284c7` |
| Refusal Accent | `refusal` | `#f59e0b` | `#d97706` |
| Brand Gradient | `bg-brand` | Linear gradient (violet → cyan) | Linear gradient (violet → cyan) |

## Key Components & Interactions

### 1. IngestPanel (Document Upload Dock)
Docked immediately below the edge-to-edge navigation bar. Features an interactive dashed drag-and-drop zone, file queue chips, and ingestion status readout with animation.

### 2. Chat Canvas & Optimistic Message Bubbles
- **User Messages**: Right-aligned pills with high-contrast text and subtle brand border. Rendered immediately upon user input with zero network lag via optimistic state.
- **Assistant Responses**: Left-aligned structured cards featuring the Lumen gradient mark, clean citation-stripped typography, and interactive expandable source cards.
- **Empty State Hero**: Centered hero layout with brand mark and guided prompts for new conversations.

### 3. Left-Anchored Thinking State (`LoadingState.tsx`)
- Left-anchored immediately below the assistant mark to maintain natural conversational chat flow.
- Features an animated 3x3 pixel grid wavefront (`LoaderGrid`), shimmering gradient status text, and a live tabular elapsed timer (`useElapsed`).

### 4. Custom In-App Confirmation Modal (`ConfirmModal.tsx`)
- Replaces native browser `window.confirm` with a non-blocking, accessible dialog.
- Built with `role="dialog"`, `aria-modal="true"`, and frosted backdrop (`backdrop-blur-xs`).
- **Defensive Focus**: Auto-focuses the **Cancel** button on open via `useRef` to prevent accidental destructive execution on Enter.
- **Keyboard Dismissal**: Global `keydown` listener on `Escape` key safely cancels the action.

### 5. SourcePins & Evidence Badges
- Groups citations by base document name, deduplicating identical snippets via normalized fingerprinting.
- Expandable drawer displays snippet preview, page number, and chunk index.
- Special `IMG` / `FIGURE` badge for visual charts and diagrams analyzed by Groq Vision.

## Anti-Patterns Avoided

- **No Synchronous Blocking Popups**: Native browser alerts and confirms are eliminated in favor of state-driven React modals.
- **No Orphan Chunks**: Every chunk maintains contextual metadata to eliminate isolated search failure.
- **No Inline Citation Clutter**: Responses are free of bracketed `[1][2]` tags in prose, preserving reading flow.
- **No Fragmented Division Bars**: Heavy background separators replaced with clean 1px hairline dividers.
