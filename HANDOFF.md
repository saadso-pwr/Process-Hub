# Process Hub — Engineering Handoff

A handoff for any developer or AI coding agent picking up this project. It
describes what exists, how to run it, the architecture, and what's left to do.

> **Read first:** `AGENTS.md` / `CLAUDE.md` in the repo root. This is **Next.js
> 16 (App Router)** with breaking changes vs older Next — when touching routing,
> params, or framework APIs, check `node_modules/next/dist/docs/` rather than
> assuming. Prisma here is **v7** (also has breaking changes — see DB section).

---

## 1. What this is

**Process Hub** is a Next.js app that hosts a set of "process maps" plus a
**custom visual process-diagram builder** at **`/create`**. The builder lets you:

- Hand-draw flowcharts: **box / circle / diamond** nodes (color, fill, solid/
  dashed/dotted border, multiple text lines), connect them with styleable
  arrows, double-click to rename, drag corners to resize.
- **Swim lanes**: add horizontal lanes; drop steps into a lane (they snap to the
  lane's centre). Auto-layout is lane-aware.
- **"Converge with AI"**: a conversational chat panel that builds/edits the
  diagram (talks to Claude when a key is set; falls back to a deterministic text
  parser otherwise). Tunable AI preferences (style, palette, reference).
- **Library**: folders of saved diagrams, persisted in **Postgres** (Prisma).
- **Upload** a PDF/PNG/SVG into a folder and mark it up with shapes/arrows.
- **Present mode**: hides all UI for a full-screen, fitted view (Esc to exit).
- **Undo/redo**, **multi-select alignment**, **clickable node popups** (title/
  text/links), and **export** to PNG/SVG/PDF/JSON.

The rest of the app is the "PowerOne shell" (left rail + header) wrapping the
existing read-only process maps under `/process-hub/...`.

---

## 2. Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript** (strict).
- **Tailwind CSS v4** (most builder UI uses inline styles, not Tailwind).
- **@xyflow/react** (React Flow v12) — the canvas engine.
- **@dagrejs/dagre** — automatic graph layout.
- **Prisma v7** + **@prisma/adapter-pg** + **Postgres** (via Docker) — library
  persistence.
- **html-to-image** + **jspdf** — diagram export.
- Anthropic API (optional) for live AI generation.

---

## 3. Running it

```bash
cp .env.example .env          # DATABASE_URL defaults to the docker DB on :5433
npm install                   # runs `prisma generate` via postinstall
npm run db:up                 # start Postgres (docker compose)
npm run db:migrate            # apply migrations (creates tables)
npm run dev                   # http://localhost:3000  → open /create
```

The app is auth-gated by a local "Continue locally" session. In dev you can set
`localStorage["process-hub.local-session"] = "active"` to skip the login screen.

DB scripts: `db:up`, `db:down`, `db:migrate` (deploy), `db:migrate:dev` (create a
new migration), `db:studio` (Prisma Studio).

> **Gotcha:** the bundled Postgres maps to host port **5433** (not 5432) to
> avoid clashing with a local Postgres. The dev machine used during development
> already had a Postgres on 5432.

### Environment variables (`.env`, gitignored)
- `DATABASE_URL` — Postgres connection string (required for the library).
- `ANTHROPIC_API_KEY` — optional; enables live "Converge with AI". Without it the
  built-in text parser is used.
- `CONVERGE_MODEL` — optional model override (default `claude-sonnet-4-6`).

---

## 4. Architecture / file map

### Routing & shell
- `src/app/[[...slug]]/page.tsx` + `HomeClient.tsx` — `/process-hub/:cat/:sub`
  routing and the read-only map components.
- `src/app/create/page.tsx` — renders `<ProcessBuilder/>`.
- `src/components/PowerOneShell.tsx` — left rail + header; the **"Create"** rail
  item links to `/create`; the header **"Present"** button drives presentation
  mode (via `src/components/presentation.ts` React context).

### The builder (`src/components/builder/`)
- `diagram.ts` — **the core data model + logic** (no React). Canonical shape
  (`{nodes, edges, lanes?}` with node `type: start|end|task|decision` and
  optional `lane`), conversion to/from the React Flow "builder" shape,
  `parseProcessText` (the offline parser), `coerceCanonical` (validate AI
  output), `layoutDiagram` (plain dagre), `layoutLaned` (swimlane-aware) and
  `autoLayout` (picks one), `makeId`, lane/media helpers.
- `ProcessBuilder.tsx` — the orchestrator (`BuilderInner`): React Flow state,
  all handlers (add/connect/drag/reparent/tidy/AI/save/upload/align/copy/paste/
  export), keyboard shortcuts, and composition of the panels. Wrapped in
  `<ReactFlowProvider>`.
- `CustomNode.tsx` — box/circle/diamond node (resizer, handles, inline edit,
  popup `+` badge).
- `LaneNode.tsx` — swim lane (header label, resizer).
- `MediaNode.tsx` — uploaded PDF/PNG/SVG backdrop.
- `Toolbar.tsx` — top toolbar (title, undo/redo, add shapes/lane, flow
  direction, Tidy, Save, **Export menu**, Converge with AI).
- `LibraryPanel.tsx` — Generate cards + folder/diagram library (+ archive).
- `AiChat.tsx` — conversational AI drawer + `AiSettings` modal.
- `Inspectors.tsx` — `Inspector` (node), `LaneInspector`, `EdgeInspector`,
  `NodePopupCard`, `AlignBar`.
- `kit.tsx` — **shared**: theme constants (`FF`, `BRAND_BLUE`, `ACCENT`,
  `COLOR_SWATCHES`, `inputStyle`), primitives (`Field`, `Seg`, `IconBtn`,
  `Divider`, `MenuItem`…), glyphs, edge-style helpers (`EdgeMarkerDefs`,
  `readEdgeStyle`, `applyEdgePatch`, `EndCap`/`LineStyle`), the **library API
  client** (`libApi`, `LibraryItem`, `EMPTY_STORE`, `buildDoc`, `readAsDataUrl`,
  `imageSize`), and AI types (`ChatMsg`, `AiPrefs`, `readPrefs`…).
- `useUndoRedo.ts` — history hook (`takeSnapshot`/`undo`/`redo`); snapshots are
  taken **before** each mutation, with a `group` to coalesce bursts (typing/drag).
- `helperLines.ts` — smart-alignment guide computation while dragging.

### Backend
- `prisma/schema.prisma` — `Folder` + `Diagram` (`doc` is JSON: the full
  `{nodes, edges}`, including uploaded media as data URLs). Client generates to
  `src/generated/prisma` (gitignored; regenerated by `postinstall`).
- `src/lib/prisma.ts` — Prisma client singleton using the **pg driver adapter**
  (Prisma 7 requires an adapter; there is **no `url` in `schema.prisma`** — it
  lives in `prisma.config.ts` for the CLI, and the runtime uses the adapter).
- `src/lib/seedLibrary.ts` — sample folders/diagrams seeded on first load.
- `src/app/api/library/...` — `GET /api/library` (loads all, lazy-seeds when
  empty), `POST /folders`, `POST /diagrams`, `PATCH|DELETE /diagrams/[id]`.
- `src/app/api/converge/route.ts` — AI endpoint. `GET` reports whether a key is
  configured; `POST` holds a multi-turn conversation with Claude (system prompt
  teaches the canonical schema **including swimlanes**) and returns
  `{ reply, diagram }`. Falls back to `parseProcessText` with no key.

### Data flow in one line
`text/chat → canonical {nodes,edges,lanes} → canonicalToBuilder → autoLayout →
React Flow nodes/edges`. Saving serializes the React Flow doc to the `Diagram.doc`
JSON column. `builderToCanonical` reverses it to give the AI current context.

---

## 5. Conventions

- Brand colors: `#00037C` (blue), `#31BAF0` (accent). Font: Manrope.
- Builder UI is inline-styled (not Tailwind) for fast iteration.
- **Never hardcode node positions** — positions come from `autoLayout`/dagre, or
  the user's drag. AI/parser output has no coordinates.
- IDs use `makeId(prefix)` (time + counter + random) so they never collide across
  reloads or with already-on-canvas nodes.
- Verify changes by running the dev server and the `/create` page; `npx tsc
  --noEmit` and `npx eslint src/components/builder` should both be clean.
- Commit messages end with the project's `Co-Authored-By` trailer.

---

## 6. Current state (where we left off)

`main` is at commit **`572a53f`** ("Lane-aware layout, undo/redo, and split
builder into modules"). On top of that, the following are **implemented and
verified but NOT yet committed** — commit these first:

- **Export (PNG/SVG/PDF/JSON)** — `Toolbar.tsx` Export menu + `exportAs()` in
  `ProcessBuilder.tsx` (html-to-image + jsPDF; JSON serializes the doc).
- **Copy / paste / duplicate** — Cmd/Ctrl+C/V/D with id remap + offset.
- **Smart alignment guides while dragging** — `helperLines.ts` +
  `onNodesChangeGuided` (snaps top-level nodes; pink guide lines).

Uncommitted files: `src/components/builder/ProcessBuilder.tsx`,
`src/components/builder/Toolbar.tsx`, `src/components/builder/helperLines.ts`
(new), and `package.json` / lockfile (html-to-image, jspdf).

Verification done live: JSON + PNG export download correctly; Cmd+D duplicates a
node (8→9); fresh dev-server compile is clean (no console/server errors). Smart
guides are wired and type/lint-clean but are best confirmed with a real mouse
(synthetic mid-drag state isn't observable in automated checks).

**Suggested first action for the next agent:** `git add -A && git commit` the
above as "Add diagram export + copy/paste/duplicate + alignment guides", then
continue with the backlog below.

---

## 7. Backlog (prioritized)

### Still broken / risky
1. **No autosave / dirty indicator** — Fresh Diagram, opening an item, or a
   refresh discards unsaved canvas work.
2. **AI re-layout still moves things** — same-structure edits preserve positions
   (id-matched), but adding/removing a step or any lane change re-runs layout.
3. **SVG upload XSS** — uploaded SVGs render from a data URL; sanitize/rasterize
   before storing, especially once sharing exists.
4. **Browser-specific edge markers** — arrow/dot colors use SVG `context-stroke`
   (Chromium-only); won't follow line color in Safari/Firefox. Consider
   per-color generated markers.

### Optimizations
- Code-split `/create` (it pulls React Flow + dagre into the bundle).
- Compress images on upload before storing.
- Stream AI responses / trim payloads (full diagram round-trips each turn).
- Virtualize the library list; add rate-limit/validation guardrails to `/api`.

### Features
- **Vision: file → editable diagram** (Claude vision turns an uploaded
  screenshot/PDF into an editable flow).
- **Sub-process drill-down** (a node opening its own nested diagram).
- **Scope tag + owners/RACI on nodes** (PortCo / Portfolio / Whole-portfolio;
  auto-assign steps to lanes).
- **Diagram validation** (disconnected nodes, missing start/end, unlabeled
  decision branches).
- **Sharing links + version history** (backend exists; this is the next layer).

---

## 8. Known limitations / footguns

- Prisma 7: driver-adapter is mandatory; `url` must NOT be in `schema.prisma`.
  Migrations are generated offline via `prisma migrate diff` and live in
  `prisma/migrations/0_init`.
- The dev server's HMR error buffer (and the browser console buffer) can show
  **stale** errors after a transient broken edit; restart the dev server to get
  a definitive read. The page actually working is the ground truth.
- `window.prompt`/`confirm` are used in a couple of flows (e.g. new-folder
  prompt, clear-canvas confirm). They work in real browsers but are blocked in
  some embedded/preview webviews.
- Library media is stored as data URLs inside the `doc` JSON — fine for a
  prototype, but large PDFs bloat rows; revisit with object storage later.
